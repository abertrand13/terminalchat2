// Import modules
var readline = require('readline');
var Firebase = require('firebase');
var keypress = require('keypress');
var env = require('node-env-file');

// Load environment variables
env(__dirname + '/.env');

// Define globals
var rl;					// readline interface
var name, uid;			// user-specific vars
var readingInput;		// state vars
var db;					// firebase db connection
var queuedMessages = [];// queue of incoming messages
var sentMessages = [];	// list of sent messages (that have yet to be deleted)
var numConnectedUsers = 0;	// number of currently active users


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
process.stdin.on('keypress', function(ch, key) {	
	if(key && key.name == 's' && key.ctrl && !readingInput) {
		readingInput = true;
		rl.question("\x1b[31m" + name + '\x1b[0m :: ' , (msg) => {
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
		});
	}

	// ctrl (q or c) to quit
	if(key && (key.name == 'q' || key.name == 'c') && key.ctrl) {
		console.log("Shutting down.");
		process.exit(0);
	}
});

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
	keypress(process.stdin);
	readingInput = false;

	// set up db connection
	db = new Firebase(process.env.dburl);
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

function processSentMessages() {
	var msg;
	while(msg = sentMessages.shift()) {
		msg.remove();	
	}
}

function displayMessage(newMsg) {	
	console.log("\x1b[37m" + newMsg.name +  "\x1b[0m :: " + newMsg.text);
}

function printInfo(msg) {
	console.log("\x1b[34m" + msg + "\x1b[0m");
}

process.stdin.setRawMode(true);
