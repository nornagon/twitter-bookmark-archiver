require('dotenv').config()
const {TwitterApi} = require('twitter-api-v2')
const readline = require('readline/promises')
const fs = require('fs/promises')
const {createWriteStream} = require('fs')
const path = require('path')
const { Writable } = require('stream')

async function login() {
  const { TWITTER_CLIENT_ID, TWITTER_CLIENT_SECRET } = process.env
  try {
    const { accessToken, expiry } = JSON.parse(await fs.readFile('.auth', 'utf-8'))
    if (expiry > Date.now() + 5*60*1000)
      return new TwitterApi(accessToken)
    else {
      console.log('token expired')
    }
  } catch (e) {
    // continue
  }
  const rl = readline.createInterface(process.stdin, process.stdout)
  const authClient = new TwitterApi({ clientId: TWITTER_CLIENT_ID, clientSecret: TWITTER_CLIENT_SECRET });

  let got
  const received = new Promise(r => got = r)
  const server = require('http').createServer((req, res) => {
    console.log(req.url)
    const url = new URL('http://localhost:3000' + req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    got({code, state})
    res.end()
  })
  await new Promise(r => server.listen(3000, r))
  const { url, codeVerifier, state } = authClient.generateOAuth2AuthLink('http://localhost:3000', { scope: ['bookmark.read', 'users.read', 'tweet.read'] });

  console.log(`log in at: ${url}`)
  const {code, state: newState} = await received
  console.log(state, newState)
  if (!newState)
    throw new Error(`no new state: ${code}`)
  if (state !== newState)
    throw new Error('tokens do not match')

  const logInClient = new TwitterApi({ clientId: TWITTER_CLIENT_ID, clientSecret: TWITTER_CLIENT_SECRET   });
  const { client: {readOnly: loggedInClient}, accessToken, refreshToken, expiresIn } = await logInClient.loginWithOAuth2({code, codeVerifier, redirectUri: 'http://localhost:3000'});
  await fs.writeFile('.auth', JSON.stringify({accessToken, refreshToken, expiry: Date.now() + expiresIn * 1000}), 'utf-8')
  return loggedInClient
}

async function main() {
  const {default: pLimit} = await import('p-limit')
  const client = await login()

  console.log('starting...')
  const bms = await client.v2.bookmarks({
    expansions: ['attachments.media_keys', 'attachments.poll_ids', 'referenced_tweets.id', 'referenced_tweets.id.author_id', 'author_id', 'entities.mentions.username', 'in_reply_to_user_id'],
    'media.fields': ['url', 'alt_text', 'preview_image_url', 'type', 'variants', 'width', 'height'],
    'user.fields': ['id', 'name', 'profile_image_url', 'url', 'username', 'verified'],
    'tweet.fields': ['attachments', 'author_id', 'created_at', 'conversation_id', 'entities', 'id', 'in_reply_to_user_id', 'referenced_tweets', 'source', 'text', 'public_metrics'],
  })
  const allBookmarks = await fs.readFile('all_bookmarks.json', 'utf-8').then(j => JSON.parse(j.slice(j.indexOf('['))), () => [])
  if (!allBookmarks.length) {
    let i = 0
    for await (const tweet of bms) {
      const medias = bms.includes.medias(tweet)
      const author = bms.includes.author(tweet)
      const bm = {
        tweet,
        medias,
        author,
      }
      allBookmarks.push(bm)
      i++;
      if (i % 10 === 0) console.log(i)
    }
    await fs.writeFile('all_bookmarks.json', 'window.TWEETS = ' + JSON.stringify(allBookmarks, null, 2), 'utf-8')
  }
  const downloadList = new Set
  for (const bm of allBookmarks) {
    for (const media of bm.medias ?? []) {
      if (media.type === 'photo') {
        downloadList.add(media.url)
      } else if (media.type === 'video' || media.type === 'animated_gif') {
        const mp4s = media.variants.filter(t => t.content_type === 'video/mp4')
        mp4s.sort((a, b) => b.bit_rate - a.bit_rate)
        const highestQuality = mp4s[0]
        downloadList.add(highestQuality.url)
        downloadList.add(media.preview_image_url)
      } else {
        throw new Error(`unknown media type: ${media.type}`)
      }
    }
    downloadList.add(bm.author.profile_image_url)
  }
  console.log(downloadList.size, 'medias')
  const limit = pLimit(8)
  await Promise.all([...downloadList].map(url => limit(async () => {
    const u = new URL(url)
    const filename = path.join(u.host, u.pathname)
    if (await fs.access(filename).then(() => true, () => false)) {
      return
    }
    await fs.mkdir(path.dirname(filename), {recursive: true})
    console.log('downloading', url)
    const res = await fetch(url)
    const dest = Writable.toWeb(createWriteStream(filename))
    await res.body.pipeTo(dest)
    console.log('done', url)
  })))
}

main()
