const readline = require('readline');
var Firebase = require('firebase');
var keypress = require('keypress');
var env = require('node-env-file');

env(__dirname + '/.env');

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

var db = new Firebase(process.env.dburl); // make this more secure LOL

keypress(process.stdin);
var readingInput = false;

var name;
var uid;

console.log("Welcome to Terminal Chat!");
console.log("Ctrl+s to send a message, Ctrl+q to quit");

rl.question('Identify Yourself: ', (myName) => {
	name = myName;
	uid = name + Math.random();
});

// log received messages
db.on('child_removed', function(snapshot) {
	var newMsg = snapshot.val();
	if(newMsg.uid == uid) {
		// we sent this message
		console.log("[delivered]");
	} else {	
		console.log(newMsg.name, "::", newMsg.text);
	}
});

// interrupt for sending messages
process.stdin.on('keypress', function(ch, key) {

	if(key && key.name == 's' && key.ctrl && !readingInput) {
		readingInput = true;
		rl.question(name + ' :: ' , (msg) => {
			// LITERALLY JUST ADDING THIS AND REMOVING IT AND IT KILLS ME
			// I don't see any major reasons (at the moment) why message delivery would be
			// unreliable, but I'll have to do some testing
			db.push({
				"uid"  : uid,
				"name" : name,
				"text" : msg
			}).remove();

			readingInput = false;	
		});
	}

	// ctrl q to quit
	if(key && key.name == 'q' && key.ctrl) {
		console.log("Shutting down.");
		process.exit(0);
	}

	// also ctrl c, because not having it is confusing
	if(key && key.name == 'c' && key.ctrl) {
		console.log("Shutting down.");
		process.exit(0);
	}
});

process.stdin.setRawMode(true);
