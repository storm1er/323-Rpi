var bleno = require('bleno');

var BlenoPrimaryService = bleno.PrimaryService;

var Relais_1 = require('./characteristics/relais_1');

console.log('bleno - echo');

bleno.on('stateChange', function(state) {
  console.log('on -> stateChange: ' + state);

  if (state === 'poweredOn') {
    bleno.startAdvertising("323 by Storm1er", ['ec00']);
  } else {
    bleno.stopAdvertising();
  }
});

bleno.on('advertisingStart', function(error) {
  console.log('on -> advertisingStart: ' + (error ? 'error ' + error : 'success'));

  if (!error) {
    bleno.setServices([
      new BlenoPrimaryService({
        uuid: 'ec00',
        characteristics: [
          new Relais_1()
        ]
      })
    ]);
  }
});

bleno.on('advertisingStartError', function(error){
	console.log('advertisingStartError : '+error);
});
bleno.on('servicesSetError', function(error){
	console.log('servicesSetError : '+error);
});
bleno.on('accept', function(clientAddress){
	console.log('accept : '+clientAddress);
}); // not available on OS X 10.9
bleno.on('disconnect', function(clientAddress){
	console.log('disconnect : '+clientAddress);
}); // Linux only
bleno.on('mtuChange', function(mtu) {
  console.log('on -> mtuChange: ' + mtu);
});
bleno.on('advertisingStop', function(){
	console.log('advertisingStop');
});
bleno.on('servicesSet', function(){
	console.log('servicesSet');
});
bleno.on('rssiUpdate', function(rssi){
	console.log('rssiUpdate : '+rssi);
}); // not available on OS X 10.9
