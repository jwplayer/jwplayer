/**
 * jwplayer.html5 API
 *
 * @author pablo
 * @version 6.0
 */
(function(html5) {
	var _utils = jwplayer.utils;
	
	html5.controller = function(model, view) {
		var _model = model, 
			_view = view,
			_video = model.video,
			_debug = 'console',
			_eventDispatcher = new jwplayer.events.eventdispatcher(_model.id, _debug);
		
		_utils.extend(this, _eventDispatcher);

		function _init() {
			_model.addGlobalListener(_forward);
		}
		
		function _forward(evt) {
			_eventDispatcher.sendEvent(evt.type, evt);
		}

		var file;
		
		this.load = function(item) {
			if (_video.getTag().canPlayType("video/mp4")) {
				file = "http://playertest.longtailvideo.com/bunny.mp4";		
			} else if (_video.getTag().canPlayType("video/webm")) {
				file = "http://playertest.longtailvideo.com/bunny.webm";		
			} else {
				file = "http://playertest.longtailvideo.com/bunny.ogv";		
			}
		}
		
		this.play = function() {
			if (_model.state == jwplayer.events.state.IDLE) {
				_video.load(file);
			}
			_video.play();
		}

		this.stop = function() {
			_video.stop();
		}

		this.pause = function() {
			if (_model.state == jwplayer.events.state.PLAYING || _model.state == jwplayer.events.state.BUFFERING) {
				_video.pause();
			}
		}

		this.seek = function(pos) {
			_video.seek(pos);
		}
		
		this.volume = function(vol) {
			_video.volume(vol);
		}
		
		this.mute = function(state) {
			if (!_utils.exists(state)) state = !_model.mute;
			_video.mute(state);
		}

		this.prev = function() {
		}

		this.next = function() {
		}
		
		this.item = function(item) {}
		
		this.fullscreen = function(state) {}

		_init();
	}
})(jwplayer.html5);

