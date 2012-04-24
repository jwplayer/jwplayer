/**
 * jwplayer.html5 API
 *
 * @author pablo
 * @version 6.0
 */
(function(html5) {
	var _jw = jwplayer, 
		_utils = _jw.utils, 
		_events = _jw.events, 
		_states = _events.state;
	
	html5.controller = function(model) {
		var _model = model, 
			_video = model.getVideo(),
//			_debug = 'console',
			_eventDispatcher = new _events.eventdispatcher(_model.id);
		
		_utils.extend(this, _eventDispatcher);

		function _init() {
			_model.addGlobalListener(_forward);
			_model.addEventListener(_events.JWPLAYER_MEDIA_BUFFER_FULL, _bufferFullHandler);
		}
		
		function _forward(evt) {
			_eventDispatcher.sendEvent(evt.type, evt);
		}
		
		function _bufferFullHandler(evt) {
			_video.play();
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
			if (_utils.isMobile()) {
				_video.load(file);
			}
		}
		
		this.play = function() {
			if (_model.state == _states.IDLE) {
				_video.load(file);
			} else if (_model.state == _states.PAUSED) {
				_video.play();
			}
		}

		this.stop = function() {
			_video.stop();
		}

		this.pause = function() {
			if (_model.state == _states.PLAYING || _model.state == _states.BUFFERING) {
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
		
		_init();
	}
})(jwplayer.html5);

