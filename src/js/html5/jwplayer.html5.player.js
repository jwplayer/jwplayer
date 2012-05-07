/**
 * Main HTML5 player class
 *
 * @author pablo
 * @version 6.0
 */
(function(html5) {
	html5.player = function(config) {
		var _api = this,
			_model = new html5.model(config), 
			_view = new html5.view(this, _model), 
			_controller = new html5.controller(_model, _view);

		function _init() {
			_api.id = _model.id;
			
			var setup = new html5.setup(_model, _view, _controller);
			setup.addEventListener(jwplayer.events.JWPLAYER_READY, _readyHandler);
			setup.addEventListener(jwplayer.events.JWPLAYER_ERROR, _errorHandler);
			setup.start();
		}
		
		function _readyHandler(evt) {
			_view.completeSetup();
			_controller.sendEvent(evt.type, evt);
			_controller.sendEvent(jwplayer.events.JWPLAYER_PLAYLIST_LOADED, {playlist: _model.playlist});
			_controller.sendEvent(jwplayer.events.JWPLAYER_PLAYLIST_ITEM, {index: _model.item});
			_controller.load();
			setTimeout(_view.resize, 0);
		}

		function _errorHandler(evt) {
			console.log(evt);
			alert("Can't set up: " + evt.message);
		}

		
		/** Methods **/
		
		this.jwPlay = _controller.play;
		this.jwPause = _controller.pause;
		this.jwStop = _controller.stop;
		this.jwSeek = _controller.seek;
		this.jwSetVolume = _controller.setVolume;
		this.jwSetMute = _controller.setMute;
		this.jwLoad = _controller.load;
		this.jwPlaylistNext = _controller.next;
		this.jwPlaylistPrev = _controller.prev;
		this.jwPlaylistItem = _controller.item;
		this.jwSetFullscreen = _controller.setFullscreen;
		this.jwResize = _view.resize;		
		this.jwSeekDrag = _model.seekDrag;
		this.jwSetStretching = _controller.setStretching;

		

		/** Getters **/
		
		function _statevarFactory(statevar) {
			return function() {
				return _model[statevar];
			};
		}
		
		this.jwGetPlaylistIndex = _statevarFactory('item');
		this.jwGetPosition = _statevarFactory('position');
		this.jwGetDuration = _statevarFactory('duration');
		this.jwGetBuffer = _statevarFactory('buffer');
		this.jwGetWidth = _statevarFactory('width');
		this.jwGetHeight = _statevarFactory('height');
		this.jwGetFullscreen = _statevarFactory('fullscreen');
		this.jwGetVolume = _statevarFactory('volume');
		this.jwGetMute = _statevarFactory('mute');
		this.jwGetState = _statevarFactory('state');
		this.jwGetStretching = _statevarFactory('stretching');
		this.jwGetPlaylist = _statevarFactory('playlist');

		
		/** InStream API **/
		this.jwDetachMedia = _controller.detachMedia;
		this.jwAttachMedia = _controller.attachMedia;
		
		var _instreamPlayer;
		
		this.jwLoadInstream = function(item, options) {
			if (!_instreamPlayer) {
				_instreamPlayer = new html5.instream(_api, _model, _view, _controller);
			}
			setTimeout(function() {
				_instreamPlayer.load(item, options);
			}, 10);
		}
		
		this.jwInstreamDestroy = function() {
			if (_instreamPlayer) {
				_instreamPlayer.jwInstreamDestroy();
			}
		}
		
		/** Events **/
		this.jwAddEventListener = _controller.addEventListener;
		this.jwRemoveEventListener = _controller.removeEventListener;
		
		
		_init();
	}
})(jwplayer.html5);

