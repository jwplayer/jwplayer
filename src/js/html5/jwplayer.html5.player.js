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
			_controller.playerReady(evt);
		}

		function _errorHandler(evt) {
			jwplayer.utils.log('There was a problem setting up the player: ' + evt.message);
		}
		
		/** Methods **/
		
		_api.jwPlay = _controller.play;
		_api.jwPause = _controller.pause;
		_api.jwStop = _controller.stop;
		_api.jwSeek = _controller.seek;
		_api.jwSetVolume = _controller.setVolume;
		_api.jwSetMute = _controller.setMute;
		_api.jwLoad = _controller.load;
		_api.jwPlaylistNext = _controller.next;
		_api.jwPlaylistPrev = _controller.prev;
		_api.jwPlaylistItem = _controller.item;
		_api.jwSetFullscreen = _controller.setFullscreen;
		_api.jwResize = _view.resize;		
		_api.jwSeekDrag = _model.seekDrag;
		_api.jwSetStretching = _controller.setStretching;

		

		/** Getters **/
		
		function _statevarFactory(statevar) {
			return function() {
				return _model[statevar];
			};
		}
		
		_api.jwGetPlaylistIndex = _statevarFactory('item');
		_api.jwGetPosition = _statevarFactory('position');
		_api.jwGetDuration = _statevarFactory('duration');
		_api.jwGetBuffer = _statevarFactory('buffer');
		_api.jwGetWidth = _statevarFactory('width');
		_api.jwGetHeight = _statevarFactory('height');
		_api.jwGetFullscreen = _statevarFactory('fullscreen');
		_api.jwGetVolume = _statevarFactory('volume');
		_api.jwGetMute = _statevarFactory('mute');
		_api.jwGetState = _statevarFactory('state');
		_api.jwGetStretching = _statevarFactory('stretching');
		_api.jwGetPlaylist = _statevarFactory('playlist');

		
		/** InStream API **/
		_api.jwDetachMedia = _controller.detachMedia;
		_api.jwAttachMedia = _controller.attachMedia;
		
		var _instreamPlayer;
		
		_api.jwLoadInstream = function(item, options) {
			if (!_instreamPlayer) {
				_instreamPlayer = new html5.instream(_api, _model, _view, _controller);
			}
			setTimeout(function() {
				_instreamPlayer.load(item, options);
			}, 10);
		}
		
		_api.jwInstreamDestroy = function() {
			if (_instreamPlayer) {
				_instreamPlayer.jwInstreamDestroy();
			}
		}
		
		/** Events **/
		_api.jwAddEventListener = _controller.addEventListener;
		_api.jwRemoveEventListener = _controller.removeEventListener;
		
		
		_init();
	}
})(jwplayer.html5);

