var util = require('util');
var bleno = require('bleno');

var BlenoCharacteristic = bleno.Characteristic;

var Relais_1 = function() {
	Relais_1.super_.call(this, {
		uuid: 'ec0e',
		properties: ['read', 'write'],
		value: null
	});

	// so you can stock everything you want
	this._data = {
		'name' : "relais 1",
		'value': false,
		'action' : "toggle"
	};

	// but you must read it with Buffer
	this._buffer = new Buffer(JSON.stringify(this._data));
};

util.inherits(Relais_1, BlenoCharacteristic);

Relais_1.prototype.onReadRequest = function(offset, callback) {
	console.log('Relais_1 - onReadRequest: value = ' + this._buffer + ' - offset = '+offset);
	callback(this.RESULT_SUCCESS, this._buffer.slice(offset, this._buffer.length));
};

Relais_1.prototype.onWriteRequest = function(new_value, offset, withoutResponse, callback) {

	var tmp = this.safelyParseJSON(new_value.toString('utf8'));
	if (typeof tmp == 'undefined' || typeof tmp.value == 'undefined') {
		return callback(this.RESULT_UNLIKELY_ERROR);
	}
	this._data.value = (tmp.value == true ? true : false);
	this._buffer = new Buffer(JSON.stringify(this._data));
	console.log('Relais_1 - onWriteRequest: value = ' + this._data.value);
	callback(this.RESULT_SUCCESS);
};

Relais_1.prototype.safelyParseJSON = function(json) {
	var parsed;
	try {
		parsed = JSON.parse(json)
	} catch (e) {
		// Oh well, but whatever...
	}
	return parsed; // Could be undefined!
};

module.exports = Relais_1;