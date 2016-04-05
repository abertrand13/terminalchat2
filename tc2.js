// Import modules
var readline = require('readline');
var Firebase = require('firebase');
var keypress = require('keypress');
var env = require('node-env-file');
var player = require('play-sound')(opts = {});

// Load environment variables
env(__dirname + '/.env');

// Define globals
var rl;					// readline interface
var name, uid;			// user-specific vars
var readingInput;		// state vars
var db;					// firebase db connection
var queuedMessages = [];// queue of incoming messages
var sentMessages = [];	// list of sent messages (that have yet to be deleted)
var queuedInfos = [];	// queue of infos to display
var numConnectedUsers = 0;	// number of currently active users
var date;				// Date object for timestamps
var currentMessage = "";// currently input message (running concatenation of buffer input)


showWelcome();
runSetup();

// Prompt user for name
rl.question('Identify Yourself: ', (myName) => {
	name = myName;

	uid = db.child('users').push(name).key();
	
	// remove our name from the list of users when we disconnect
	db.child('users').child(uid).onDisconnect().remove();

	// check for those that have joined
	db.child('users').on('child_added', function(snapshot) {
		var user = snapshot.val();
		printInfo("[" + user + " has joined]");
		numConnectedUsers++;

		// go through any messages that have been waiting for a user to connect to be deleted
		processSentMessages();
	});

	// enable keypresses for message detection
	setupKeyboardInput();
});

// output received messages.  wait 'til we're done sending if necessary
db.child('messages').on('child_removed', function(snapshot) {
	var newMsg = snapshot.val();

	// queue messages that come up while we're in the middle of writing one
	if(readingInput && newMsg.uid != uid) {
		queuedMessages.push(newMsg);
		return;
	}
	
	if(newMsg.uid == uid) {
		// we sent this message
		printInfo("[delivered]");

	} else {
		// play a sound and display the new message
		player.play(__dirname + '/alert.mp3', function(err) {});
		displayMessage(newMsg);
	}
});

// listen for users leaving, and output when they do
db.child('users').on('child_removed', function(snapshot) {
	var user = snapshot.val();
	printInfo("[" + user + " has left]");
	numConnectedUsers--;
});

/*db.child('users').on('value', function(snapshot) {
	var users = snapshot.val();
	numConnectedUsers = Object.keys(users).length;
	console.log(numConnectedUsers);
});*/


// interrupt for sending messages
function setupKeyboardInput() {
	// process.stdout.pause();
	/* process.stdin.on('keypress', function(ch, key) {
		// ctrl (q or c) to quit
		if(key && (key.name == 'q' || key.name == 'c') && key.ctrl) {
			console.log("Shutting down.");
			process.exit(0);
		} else if(!readingInput && key && key.name != 'return') {
			// only prompt once (and not while the user is inputting message or finishing message)
			// first delete current buffer
			readline.moveCursor(process.stdin, -1, 0);
			readline.clearScreenDown(process.stdin);
			// process.stdout.resume();
			process.stdin.read();	

			// console.log(process.stdin);
		
			readingInput = true;
			// display prompt (user's name) and read input in	
			rl.question(generateTimeString() + "\x1b[31m" + name + '\x1b[0m :: ' , (msg) => {
				// sender also removes message, which triggers other clients	
				var lastMsg = db.child('messages').push({
					"uid"  : uid,
					"name" : name,
					"text" : msg
				});

				if(numConnectedUsers > 1) {
					lastMsg.remove();
				} else {
					sentMessages.push(lastMsg);
					printInfo("[queued]");
				}

				readingInput = false;
				processMessageQueue();
				processInfoQueue();
			});
		}
	}); */

	process.stdin.on('data', (chunk) => {
		// console.log(chunk.toString());
		// console.log(chunk);
		
		// test for ^c	
		if(chunk[chunk.length - 1] == 3) {
			console.log('Shutting Down');
			process.exit(0);
		}

		if(!readingInput) {
			// signal that we're reading input	
			readingInput = true;
			// this is, for the moment, a hack
			process.stdout.write("\r" + generateTimeString() + '\x1b[31m' + name + '\x1b[0m :: ' + chunk.toString());
		}
		
		// add to the end of the message running message
		currentMessage += chunk.toString();
		
		// check for the enter key	
		if(chunk[chunk.length - 1] == 0xd) {
			// chop the [enter key] signal	
			currentMessage = currentMessage.slice(0, -1);
			
			// send message	
			var lastMsg = db.child('messages').push({
				"uid"  : uid,
				"name" : name,
				"text" : currentMessage
			});

			if(numConnectedUsers > 1) {
				lastMsg.remove();
			} else {
				sentMessages.push(lastMsg);
				printInfo("[queued]");
			}
			
			// reset message variables
			currentMessage = "";	
			readingInput = false;
			processMessageQueue();
			processInfoQueue();
		}
	});

	process.stdin.on('end', () => {
		console.log('andddd we\'re done');
	});
}

function showWelcome() {
	console.log("\x1b[34m+---------------------------+");
	console.log("| Welcome to Terminal Chat! |");
	console.log("+---------------------------+\x1b[0m");
	console.log("Ctrl+s to send a message, Ctrl+q to quit");
}

function runSetup() {
	// set up input
	rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});

	// more input	
	// keypress(process.stdin);
	readingInput = false;

	// set up db connection
	db = new Firebase(process.env.dburl);

	date = new Date();
}

function processMessageQueue() {
	var msg;
	if(queuedMessages.length > 0) {
		printInfo("[reading from queue]");
	}
	while(msg = queuedMessages.shift()) {
		displayMessage(msg);
	}
}

function processSentMessages() { // should rename this?
	var msg;
	while(msg = sentMessages.shift()) {
		msg.remove();	
	}
}

function processInfoQueue() {
	var info;
	while(info = queuedInfos.shift()) {
		printInfo(info);
	}
}

function displayMessage(newMsg) {	
	console.log(generateTimeString() + "\x1b[37m" + newMsg.name +  "\x1b[0m :: " + newMsg.text);
}

function generateTimeString() {
	var h = date.getHours();
	h = h < 10 ? '0' + h : h;
	var m = date.getMinutes();
	m = m < 10 ? '0' + m : m;

	return "[ " + h + ":" + m + " ] ";
}

function printInfo(msg) {
	if(readingInput) {
		queuedInfos.push(msg);
	} else {
		console.log("\x1b[34m" + msg + "\x1b[0m");
	}
}

process.stdin.setRawMode(true);
