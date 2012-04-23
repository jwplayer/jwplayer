/**
 * Main HTMl5 player class
 *
 * @author pablo
 * @version 6.0
 */
(function(html5) {
	html5.player = function(config) {
		var _model, _view, _controller,
			_api = this;
		
		function _init() {
			_model = new html5.model(config);
			
			_api.id = _model.id;
			_api.settings = _model.settings;
						
			_controller = new html5.controller(_model);
			_controller.load();
			
			(new html5.skinloader(config.skin, function(skin) {
				_api.skin = skin;
				_view = new html5.view(_api, _model);
			}, function(err) { _utils.log(err); }));
			
		}
		
		this.jwPlay = function(){ _controller.play() };
		this.jwPause = function(){ _controller.pause() };
		this.jwStop = function(){ _controller.stop() };
		this.jwSeek = function(pos){ _controller.seek(pos) };
		this.jwSetVolume = function(vol){ _controller.volume(vol) };
		this.jwSetMute = function(state){ _controller.mute(state) };
		this.jwLoad = function(item) { _controller.load(item); }
		this.jwPlaylistNext = function() { _controller.next(); }
		this.jwPlaylistPrev = function() { _controller.prev(); }
		this.jwPlaylistItem = function(item) { _controller.item(item); }
		this.jwFullscreen = function(state) { _controller.fullscreen(state); }
		
		this.jwGetState = function(){ return _model.state };
		this.jwGetVolume = function(){ return _model.volume };
		this.jwGetMute = function(){ return _model.mute };
		this.jwGetFullscreen = function(){ return false };

		this.jwAddEventListener = function(type, handler) { _controller.addEventListener(type, handler); };
		this.jwRemoveEventListener = function(type, handler) { _controller.removeEventListener(type, handler); };
		
		_init();
	}
})(jwplayer.html5);

