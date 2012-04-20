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
			_model = {
				id: "player",
				video: new html5.video(document.createElement("video")),
				settings: config,
				volume: 0,
				state: jwplayer.events.state.IDLE,
				mute: false
			};
			
			jwplayer.utils.extend(_model, new jwplayer.events.eventdispatcher());
			_model.video.addGlobalListener(function(evt) {
				switch (evt.type) {
				case jwplayer.events.JWPLAYER_MEDIA_MUTE:
					if (_model.mute == evt.mute) return;
					_model.mute = evt.mute;
					break;
				case jwplayer.events.JWPLAYER_MEDIA_VOLUME:
					if (_model.volume == evt.volume) return;
					_model.volume = evt.volume;
					break;
				case jwplayer.events.JWPLAYER_PLAYER_STATE:
					if (_model.state == evt.newstate) return;
					_model.state = evt.newstate;
				}
				_model.sendEvent(evt.type, evt);
			});
		
			_api.id = _model.id;
			_api.settings = _model.settings;
			
			_view = {};
			
			_controller = new html5.controller(_model, _view);
			_api.addEventListener = _controller.addEventListener;
			_api.removeEventListener = _controller.removeEventListener;
			
			_view.container = document.getElementById(_api.id),
			_view.controlbar = new html5.controlbar(_api, _model.settings)

		
			jwplayer.utils.appendStylesheet("#"+_api.id+" video", {
				width: "100%",
				height: "100%",
				background: "#000",
				opacity: 0,
				'-webkit-transition': 'opacity .15s ease'
			});
			
			_view.container.appendChild(_model.video.getTag());
			_view.container.appendChild(_view.controlbar.getDisplayElement());
			
			_controller.load();
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


		
		
		_init();
	}
})(jwplayer.html5);

