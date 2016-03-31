# Terminal Chat 2
In-terminal chat client written for Mac OSX, because going all the way to Facebook Messenger is hard.  Number 2, because the first one didn't even make it out of my local folders.

### Installation
1. Clone
2. Message me for your .env file settings
3. Make sure you have node and npm installed.  I recommend [homebrew] (http://brew.sh/) and then a quick run of `brew install node`
4. Run `node tc2.js` and you're up and running!

### Operation
From within the client:
- `Ctrl+s` to send a message
- New messages will come in automatically unless you are in the middle of typing out a message, in which case they'll wait for you to finish.  They're polite.
- `Ctrl+q` to quit

### What would possess you to write a terminal chat client in javascript?
A bunch of things.  Namely, that I didn't want to set up my own socket shenanigans, so I piggy-backed on firebase's.

Suffice to say, the non-javascript version was terminalchat1.  There's a reason it didn't go anywhere.

Is it a hack?  Yes, yes it is.

### Changelog
- v2.0.3 - Added alert sound.
- v2.0.2 - Messages sent out into the aether now wait for at least one person to read them before dying.  Also code cleanup.
- v2.0.1 - Added queuing of incoming messages, and user logging
- v2.0.0 - Initial

### Built with
- [nodejs](https://nodejs.org/en/)
- [firebase](https://www.firebase.com/)
- [keypress](https://www.npmjs.com/package/keypress)
- [node-env-file](https://www.npmjs.com/package/node-env-file)
- [readline](https://www.npmjs.com/package/readline)
- [play-sound](https://www.npmjs.com/package/play-sound)

### Legal Shenanigans

So that alert sound you here?  That's from Portal (great game), and I don't remember which site I got it from and I don't remember the usage licensing.  If Valve (or anyone else) sees this and wants to tell me to cut it the f#!k out, that is totally cool.
