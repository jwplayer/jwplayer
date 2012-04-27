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
			
//			_controller.load();
/*			
			(new html5.skinloader(config.skin, function(skin) {
				_api.skin = skin;
				_view.setup();
			}, function(err) { _utils.log(err); }));
*/
			var setup = new html5.setup(_model, _view, _controller);
			setup.addEventListener(jwplayer.events.JWPLAYER_READY, _readyHandler);
			setup.addEventListener(jwplayer.events.JWPLAYER_ERROR, _errorHandler);
			setup.start();
		}
		
		function _readyHandler(evt) {
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

		
		this.jwAddEventListener = _controller.addEventListener;
		this.jwRemoveEventListener = _controller.removeEventListener;
		
		_init();
	}
})(jwplayer.html5);

