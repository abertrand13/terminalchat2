const readline = require('readline');
var Firebase = require('firebase');
var keypress = require('keypress');
var env = require('node-env-file');

env(__dirname + '/.env');

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

keypress(process.stdin);
var readingInput = false;

var name;
var uid;

console.log("Welcome to Terminal Chat!");
console.log("Ctrl+s to send a message, Ctrl+q to quit");

// do this after the identify step so you already have a name
var db = new Firebase(process.env.dburl); // make this more secure LOL

rl.question('Identify Yourself: ', (myName) => {
	name = myName;

	uid = db.child('users').push(name).key();
	
	// remove our name from the list of users when we disconnect
	db.child('users').child(uid).onDisconnect().remove();

	// check for those that have joined
	db.child('users').on('child_added', function(snapshot) {
		var user = snapshot.val();
		printInfo("[" + user + " has joined]");
	});
});

var queuedMessages = [];

// log received messages
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

db.child('users').on('child_removed', function(snapshot) {
	var user = snapshot.val();
	printInfo("[" + user + " has left]");
});


// interrupt for sending messages
process.stdin.on('keypress', function(ch, key) {
	
	if(key && key.name == 's' && key.ctrl && !readingInput) {
		readingInput = true;
		rl.question("\x1b[31m" + name + '\x1b[0m :: ' , (msg) => {
			// LITERALLY JUST ADDING THIS AND REMOVING IT AND IT KILLS ME
			// I don't see any major reasons (at the moment) why message delivery would be
			// unreliable, but I'll have to do some testing
			db.child('messages').push({
				"uid"  : uid,
				"name" : name,
				"text" : msg
			}).remove();

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


function processMessageQueue() {
	var msg;
	if(queuedMessages.length > 0) {
		printInfo("[reading from queue]");
	}
	while(msg = queuedMessages.shift()) {
		displayMessage(msg);
	}
}

function displayMessage(newMsg) {	
	console.log("\x1b[37m" + newMsg.name +  "\x1b[0m :: " + newMsg.text);
}

function printInfo(msg) {
	console.log("\x1b[34m" + msg + "\x1b[0m");
}

process.stdin.setRawMode(true);
