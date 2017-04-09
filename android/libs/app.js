
window.originalSetInterval=window.setInterval;
window.originalClearInterval=window.clearInterval;
window.activeTimers=0;
const dev = true;

const ln = function() { // retourne la ligne d'execution quand c'est possible
	var e = new Error();
	if (!e.stack) try {
		// IE requires the Error to actually be throw or else the Error's 'stack'
		// property is undefined.
		throw e;
	} catch (e) {
		if (!e.stack) {
			return 0; // IE < 10, likely
		}
	}
	var stack = e.stack.toString().split(/\r\n|\n/);
	// We want our caller's frame. It's index into |stack| depends on the
	// browser and browser version, so we need to search for the second frame:
	var frameRE = /:(\d+):(?:\d+)[^\d]*$/;
	do {
		var frame = stack.shift();
	} while (!frameRE.exec(frame) && stack.length);
	return frameRE.exec(stack.shift())[1];
};
window.setInterval=function(func,delay) {
	var id = window.originalSetInterval(func,delay);
	window.activeTimers++;
	if (typeof dev != 'undefined' && dev) {
		dev && console.log('app.js : line '+ln()+' | setInterval() -> '+window.activeTimers+' id:'+id);
	}
	return id;
};
window.clearInterval=function(timerID) {
	var id = window.originalClearInterval(timerID);
	window.activeTimers--;
	if (typeof dev != 'undefined' && dev) {
		dev && console.log('app.js : line '+ln()+' | clearInterval() -> '+window.activeTimers+' id:'+timerID);
	}
	return id;
};
const uniqid = function(len) {
	len = (typeof len === 'undefined' ? 8 : len);
	var chars = "123456789ABCDEFGHIJKLMNPQRSTUVWXTZabcdefghiklmnpqrstuvwxyz";
	var string_length = 10;
	var randomstring = '';

	for (var x=0;x<string_length;x++) {

		var letterOrNumber = Math.floor(Math.random() * 2);
		if (letterOrNumber == 0) {
			var newNum = Math.floor(Math.random() * 9);
			randomstring += newNum;
		} else {
			var rnum = Math.floor(Math.random() * chars.length);
			randomstring += chars.substring(rnum,rnum+1);
		}

	}
	return (randomstring);
};
const log = function(ln, ...args){
	console.log(
		'app.js : line '+
		ln+
		' | '+
		log.caller.name+
		'() -> '+
		JSON.stringify(args)
	);
};

var view;
var mazda = {
	init:function(){
		log(ln());

		var interval = setInterval(function(){
			if (evothings.gotDOMContentLoaded !== false) {
				clearInterval(interval);
				mazda.render.base(mazda.render.blePairedDevices);
			}
		}, 100);
	},
	/******************************/
	/********** RENDER ************/
	/******************************/
	render:{
		base:function(callback){
			log(ln());
			var fail = function(){
				log(ln());
				view.html('Ça à foiré');
			};
			var addToHtml = function(list){
				log(ln(), list);
			};
			var html =
				'<h1>Listes des périphériques</h1>';

			log(ln(), bluetoothSerial);
			//evothings.bluetoothSerial.list(addToHtml, failure);
		}
	}
};

jQuery(document).ready(function($) {
	view = $('#main');
	mazda.init();
});

