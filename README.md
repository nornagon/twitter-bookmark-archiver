# Export your Twitter Bookmarks

> **Note**
> 
> I made a better version of this that just runs in your browser!
>
> [👉 Try it out!](https://twitter-bookmark-archiver.glitch.me/)

This is a script which lets you export your Twitter Bookmarks, including all
media (photos and videos, as well as fully expanded URLs) attached to those
tweets.

Unfortunately it's not possible for me to make a website which does this for
you, because the [Twitter API does not support
CORS](https://twittercommunity.com/t/twitter-api-v2-public-client-no-access-control-allow-origin-header-present-cors/170402/3),
and I can't pay for a server which can support the bandwidth that would be
needed to download all the media associated with everyone's bookmarks on the
backend. So you'll need to run this script yourself. It's a bit complicated.
You'll need a [Twitter Developer account](https://developer.twitter.com/).

## How to run this script


1. [Install Node.js](https://nodejs.org/en/download/).
2. [Download this script](https://github.com/nornagon/twitter-bookmark-archiver/archive/refs/heads/main.zip) and unzip it.
3. Open Terminal.app on macOS / cmd on Windows.
4. `cd` into the directory in which you unzipped the script.
5. Run
```
$ npm install
```
6. Create a file called `.env` in that same directory, with the following
   contents:
```
TWITTER_CLIENT_ID=
TWITTER_CLIENT_SECRET=
```
7. Get a [Twitter Developer account](https://developer.twitter.com/).
8. Create a new app in the Twitter Developer dashboard. You may need to apply
   for "Elevated" access, usually the approval process is immediate.
9. I'm a bit hazy on the next part as I can't repeat it since I'm limited to 1
   "project" per account, but you'll need to get the client ID and client
   secret and put them into the `.env` file. App permissions should be set to
   "Read", Type of App should be set to "Native App", and the Callback URI
   should be set to `http://localhost:3000`. It doesn't matter what your
   "Website URL" is. **If you go through this process and are able to improve
   this bit of the documentation, please open a pull request!!**
10. Once the client ID and client secret are in place in the .env file, it
    should look like this (with different tokens):
```
TWITTER_CLIENT_ID=XXXXxXXXXxxXXXXXXXXxXXxXXXXXxXXXXx
TWITTER_CLIENT_SECRET=XXXxXxXxxxXXX_xXXXXxXXXXxXXXxXX-XXXxXxXXxxxxXXXxxX
```
11. From the terminal, run:
```
node .
```
12. You should see a login URL. Click it, and authorize the app.
13. The script will start downloading your bookmarks.
14. Once it is complete, open "index.html". You should see a (somewhat crudely
    formatted) list of all your bookmarks.
