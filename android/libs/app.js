/********************************************/
/***************** HELPERS ******************/
/********************************************/
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
const clone = function (obj){ return $.extend(true, {}, obj); };
Array.prototype.extend = function (other_array) {
	if (other_array.constructor !== Array) {
		console.warn('Array expected');
		return false;
	}
    other_array.forEach(function(v) {this.push(v)}, this);
    return true;
};
Array.prototype.remove = function(from, to) {
	var rest = this.slice((to || from) + 1 || this.length);
	this.length = from < 0 ? this.length + from : from;
	return this.push.apply(this, rest);
};
const log = function(ln, ...args){
	console.log(
		'app.js line '+
		ln+
		' : '+log.caller.name+
		(args.length > 0
			? '() -> '+JSON.stringify(args)
			: '()'
		)
	);
};
/********************************************/
/***************** MAZDA ********************/
/********************************************/
var mazda = {
	/********************************************/
	/***************** VARS *********************/
	/********************************************/
	view:null,
	/********************************************/
	/***************** TRIGGER ******************/
	/********************************************/
	trigger:{
		menuBle:function(){
			log(ln());
			$('.fixed-action-btn.toolbar').closeToolbar();
			if (mazda.render.bluetooth.ph != null) {
				return mazda.render.bluetooth.showConnected(mazda.render.bluetooth.ph);
			}
			mazda.render.base(mazda.render.bluetooth.main);
		},
		menuAction:function(){
			log(ln());
			$('.fixed-action-btn.toolbar').closeToolbar();
			mazda.render.base(mazda.render.action.main);
		},
		menuSettings:function(){
			log(ln());
			$('.fixed-action-btn.toolbar').closeToolbar();
			mazda.render.base(mazda.render.settings.main);
		},
		bluetooth:{
			isSearching:false,
			search:function(){
				log(ln());
				if (mazda.trigger.bluetooth.isSearching) {
					mazda.render.bluetooth.phs = [];
					return mazda.render.base(mazda.render.bluetooth.showSearch);
				}
				mazda.trigger.bluetooth.isSearching = true;
				mazda.render.base(mazda.render.bluetooth.showSearch);
				mazda.render.bluetooth.phs = [];
				evothings.ble.startScan(mazda.render.bluetooth.addDeviceToSearchList, mazda.failure);
				setTimeout(function(){
					mazda.trigger.bluetooth.stopSearch();
				}, 10000);
			},
			stopSearch:function(callback, render){
				log(ln());
				render = (render == false ? false : true);
				if (mazda.trigger.bluetooth.isSearching) {
					mazda.trigger.bluetooth.isSearching = false;
					evothings.ble.stopScan();
				}
				mazda.render.bluetooth.phs = [];
				if (render) {
					$('#searchStopBtn').html(
						'<div onClick="mazda.trigger.bluetooth.search();">\
							Recherche terminé,<br>recommencer ?\
							<a href="#!" class="secondary-content">\
								<i class="material-icons black-text">bluetooth_searching</i>\
							</a>\
						</div>'
					);
					$('#searchStopBar').remove();
				}
				if (typeof callback == 'function') {
					callback();
				}
			},
			connect:function(ph){
				this.stopSearch(undefined, false);
				log(ln(), ph);
				var html =
					'<div class="col s12 card">\
						<div class="card-content">\
							<span class="card-title">'+ph.name+'</span>\
							<small>Connection en cours ...</small><br>\
							<div class="progress"><div class="indeterminate"></div></div>\
						</div>\
					</div>';
				mazda.view.html(html);
				evothings.ble.connectToDevice(
					ph,
					mazda.render.bluetooth.showConnected,
					mazda.render.bluetooth.showDisconnected,
					mazda.render.bluetooth.showConnectError
				);
			},
			disconnect:function(){
				log(ln());
				evothings.ble.close(mazda.render.bluetooth.ph);
				mazda.render.bluetooth.showDisconnected(mazda.render.ph);
			},
			write:function(characteristic, module, callback){
				log(ln());

				var _call = function(success){
					if (typeof callback) {
						callback();
					}
				};
				var ble = mazda.render.bluetooth;

				if (module.action == "toggle") {
					let new_val = evothings.ble.toUtf8(JSON.stringify({
						'value': (module.value ? false : true)
					}));
					evothings.ble.writeCharacteristic(ble.ph, characteristic, new_val, function(response){
						log(ln(), "write : success");
						_call(true);
					}, function(err){
						log(ln(), "write : error");
						alert("Impossible de mettre à jour la characteristique");
						_call(false);
					});
				} else if (module.action == "choice"){
					let modalId = uniqid();
					var html = '';
						'<div id="'+modalId+'" class="modal">\
							<div class="modal-content">\
								<h4>Options pour '+module.name+'</h4>\
								<ul class="collection">';
									for (var i = module.choice.length - 1; i >= 0; i--) {
										let choiceId = uniqid();
										html +=
										'<li class="collection-item" id="'+choiceId+'">'+module.choice[i]+'</li>';
										$('#'+choiceId).click(function(){
											$('#'+modalId).modal('close');
											Material.toast('Enregistrement ...', undefined, 'loadingToast');
											let new_val = new Buffer(JSON.stringify({
												'value': module.choice[i]
											}));
											evothings.ble.writeCharacteristic(ble.ph, characteristic, new_val, function(response){
												log(ln(), "write : success");
												$('.loadingToast').remove();
												Material.toast('Modification enregistré', 2000, '', function(){
													$('#'+modalId).remove();
													_call(true);
												});
											}, function(err){
												log(ln(), "write : error");
												$('.loadingToast').remove();
												Material.toast('<i class="material-icons left">warning</i>Erreur d\'écriture', 2000, 'red-text', function(){
													$('#'+modalId).remove();
													_call(false);
												});
											});
										});
									}
									html +=
								'</ul>\
							</div>\
						</div>'
					mazda.view.append(html);
					$('#'+modalId).modal('open');
				};
			}
		}
	},
	/********************************************/
	/***************** RENDER *******************/
	/********************************************/
	render:{
		init:function(){
			log(ln());
			StatusBar.backgroundColorByHexString("#004d40");
			$('#menuBle').click(mazda.trigger.menuBle);
			$('#menuAction').click(mazda.trigger.menuAction);
			$('#menuSettings').click(mazda.trigger.menuSettings);
		},
		base:function(callback){
			log(ln());
			mazda.view.html(
				'<div class="col s12 center-align">\
					<br><br><br><br><br><br><br><br>\
					<div class="preloader-wrapper big active">\
						<div class="spinner-layer spinner-blue-only">\
							<div class="circle-clipper left">\
								<div class="circle"></div>\
							</div><div class="gap-patch">\
								<div class="circle"></div>\
							</div><div class="circle-clipper right">\
								<div class="circle"></div>\
							</div>\
						</div>\
					</div>\
				</div>'
			);
			if (typeof callback == 'function') {
				callback();
			}
		},
		bluetooth:{
			phs:[],
			ph:null,
			service:null,
			characteristics:[],
			main:function(){
				log(ln());
				var that = mazda.render.bluetooth;
				var doSearch = function(){
					log(ln());
					that.showSearch();
					mazda.trigger.bluetooth.search();
				};
				bluetoothSerial.isEnabled(doSearch, function(){
					that.enable(doSearch);
				});
			},
			enable:function(callback){
				log(ln());
				bluetoothSerial.enable(callback, mazda.failure);
			},
			showPaired:function(){
				log(ln());
				var that = mazda.render.bluetooth;

				var render = function(list){
					log(ln(), list);
					var html =
						'<div class="col s12 card">\
							<div class="card-content">\
								<span class="card-title">Périphériques bluetooth associés</span>\
								<ul class="collection">\
									<li class="collection-item">\
										<div onClick="mazda.trigger.bluetooth.search();">\
											Rechercher nouveau\
											<a href="#!" class="secondary-content">\
												<i class="material-icons black-text">bluetooth_searching</i>\
											</a>\
										</div>\
									</li>';
								for (let i = 0; i < list.length; i++) {
									let ph = list[i];
									html +=
										'<li class="collection-item">\
											<div onClick="mazda.trigger.bluetooth.connect('+JSON.stringify(ph).replace(/"/g, '&quot;')+');">\
												'+ph.name+'\
												<a href="#!" class="secondary-content">\
													<i class="material-icons black-text">send</i>\
												</a>\
											</div>\
										</li>';
								}
								html +=
								'</ul>\
							</div>\
						</div>';
					mazda.view.html(html);
				};

				bluetoothSerial.list(render, mazda.failure);
			},
			showSearch:function(){
				log(ln());
				var html =
					'<div class="col s12 card">\
						<div class="card-content">\
							<span class="card-title">Recherche de périphériques bluetooth</span>\
							<ul class="collection">\
								<li class="collection-item" id="searchStopBtn">\
									<div onClick="mazda.trigger.bluetooth.stopSearch();">\
										Stopper la recherche\
										<a href="#!" class="secondary-content">\
											<i class="material-icons black-text">cancel</i>\
										</a>\
									</div>\
								</li>\
								<li class="collection-item" id="searchStopBar">\
									<div>\
										<div class="progress"><div class="indeterminate"></div></div>\
									</div>\
								</li>\
							</ul>\
						</div>\
					</div>';
				mazda.view.html(html);
			},
			addDeviceToSearchList:function(ph){
				if (mazda.render.bluetooth.phs.indexOf(ph.address) == -1) {
					mazda.render.bluetooth.phs.push(ph.address);
					log(ln(), ph);
					let id = uniqid();
					var html =
						'<li class="collection-item" id="'+id+'">\
							<div>\
								'+ph.name+'\
								<a href="#!" class="secondary-content">\
									<i class="material-icons black-text">send</i>\
								</a>\
							</div>\
						</li>';
					$(html).insertAfter('#searchStopBtn');
					$('#'+id).click(function(){mazda.trigger.bluetooth.connect(ph);});
				}
			},
			showConnected:function(ph){
				log(ln(), 'connected to', ph);
				// si pas déjà connecté
				if (mazda.render.bluetooth.ph == null) {
					var html =
						'<div class="col s12 card">\
							<div class="card-content">\
								<span class="card-title">'+ph.name+'</span>\
								<small>Connecté, recherche de fonctionnalités ...</small><br>\
								<div class="progress"><div class="indeterminate"></div></div>\
							</div>\
						</div>';
					mazda.view.html(html);

					var that = mazda.render.bluetooth;

					that.ph = ph;
					that.service = evothings.ble.getService(ph, "0000ec00-0000-1000-8000-00805f9b34fb");
					log(ln(), 'service = ', that.service);
					if (that.service == null) {
						return that.showBadDevice(ph);
					}
					that.characteristics = [
						evothings.ble.getCharacteristic(that.service, "0000ec0e-0000-1000-8000-00805f9b34fb")
					];
					log(ln(), 'characteristics = ', that.characteristics);
					if (that.characteristics.indexOf(null) != -1) {
						return that.showBadDevice(ph);
					}
				}
				var html =
					'<div class="col s12 card">\
						<div class="card-content">\
							<span class="card-title">'+ph.name+'</span>\
							<small>Connecté, périphérique compatible</small><br>\
							<a class="btn teal waves-effect waves-default" onClick="mazda.trigger.bluetooth.disconnect()">Se déconnecter</a>\
						</div>\
					</div>';
				mazda.view.html(html);
			},
			showBadDevice:function(ph){
				log(ln());
				var html =
					'<div class="col s12 card">\
						<div class="card-content">\
							<span class="card-title">'+ph.name+'</span>\
							<span class="red-text">Le périphériques n\'est pas compatible avec cette application.</span><br>\
							<a class="btn teal waves-effect waves-default" onClick="mazda.trigger.bluetooth.disconnect()">Se déconnecter</a>\
						</div>\
					</div>';
				mazda.view.html(html);
			},
			showDisconnected:function(ph){
				log(ln(), ph);
				mazda.render.bluetooth.ph = null;
				mazda.render.bluetooth.service = null;
				mazda.render.bluetooth.characteristics = [];
				alert('Vous êtes deconnecté, réinitialisation');
				mazda.failure(false);
			},
			showConnectError:function(errorCode){
				log(ln(), errorCode);
				mazda.render.bluetooth.ph = null;
				mazda.render.bluetooth.service = null;
				mazda.render.bluetooth.characteristics = [];
				if (errorCode == 19) {
					alert('Connexion perdu, réinitialisation');
				} else {
					alert('Impossible de se connecter, réinitialisation');
				}
				mazda.failure(false);
			}
		},
		action:{
			main:function(){
				log(ln());
				var ble = mazda.render.bluetooth;
				if (ble.ph == null) {
					alert('Vous devez d\'abord vous connecter.');
					return mazda.failure(false);
				}
				var html =
					'<div class="col s12 card">\
						<div class="card-content">\
							<span class="card-title">Action</span>\
							<ul class="collection" id="actionList">\
								<li class="collection-item" id="readRequestBar">\
									<div class="progress"><div class="indeterminate"></div></div>\
								</li>\
							</ul>\
						</div>\
					</div>';

				// reading chars
				let err = false;
				for (let i = ble.characteristics.length - 1; i >= 0; i--) {
					let char = ble.characteristics[i];
					evothings.ble.readCharacteristic(ble.ph, char, function(response){
						if (err) {
							return;
						}
						response = JSON.parse(evothings.ble.fromUtf8(response));
						log(ln(), "response = ", response);
						let id = uniqid();

						// define value
						let value = "Inconnu";
						switch (response.action) {
							case "toggle":
								value = (response.value ? 'Activé' : 'Désactivé');
								break;
							case "choice":
								value = response.value;
								break;
						};

						// display
						$('#actionList').prepend(
							'<li class="collection-item" id="'+id+'">'+
								response.name+' : '+value+
							'</li>'
						);

						// click trigger
						$('#'+id).click(function(){
							mazda.trigger.bluetooth.write(char, response, mazda.trigger.menuAction);
						});
					}, function(err){
						log(ln(), "err = ", err);
						if (err) {
							return;
						}
						err = true;
						mazda.failure();
					});
				}

				mazda.view.html(html);
			}
		},
		settings:{
			main:function(){
				log(ln());
			}
		},
	},
	/********************************************/
	/***************** INIT *********************/
	/********************************************/
	init:function(){
		mazda.view = $('#main');
		mazda.render.init();
		mazda.trigger.menuBle();
	},
	failure:function(popup){
		log(ln());
		popup = (popup == false ? false : true);
		if (popup) {
			alert('L\'application à rencontré une erreur, réinitialisation');
		}
		mazda.trigger.menuBle();
	}
};

document.addEventListener(
	'deviceready',
	function() { evothings.scriptsLoaded(mazda.init) },
	false
);
