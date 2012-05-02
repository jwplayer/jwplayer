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
	
	html5.controller = function(model, view) {
		var _model = model,
			_view = view,
			_video = model.getVideo(),
			_eventDispatcher = new _events.eventdispatcher(_model.id, _model.config.debug);
		
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

		function _load(item) {
			_stop();
			
			switch (_utils.typeOf(item)) {
			case "string":
				_model.setPlaylist(new html5.playlist({file:item}));
				_model.setItem(0);
				break;
			case "object":
			case "array":
				_model.setPlaylist(new html5.playlist(item));
				_model.setItem(0);
				break;
			case "number":
				_model.setItem(item);
				break;
			}
				
		}
		
		function _play() {
			if (_model.state == _states.IDLE) {
				_video.load(_model.playlist[_model.item]);
			} else if (_model.state == _states.PAUSED) {
				_video.play();
			}
		}

		function _stop() {
			_video.stop();
		}

		function _pause() {
			if (_model.state == _states.PLAYING || _model.state == _states.BUFFERING) {
				_video.pause();
			}
		}

		function _seek(pos) {
			_video.seek(pos);
		}
		
		function _setVolume(vol) {
			_video.volume(vol);
		}
		
		function _setMute(state) {
			if (!_utils.exists(state)) state = !_model.mute;
			_video.mute(state);
		}
		
		function _setFullscreen(state) {
			_view.fullscreen(state);
		}

		function _setStretching(stretching) {
			_model.stretching = stretching;
			_view.resize();
		}

		function _item(index) {
			_load(_model.item);
			_play();
		}
		
		function _prev() {
			_item(_model.item - 1);
		}
		
		function _next() {
			_item(_model.item + 1);
		}
		
		
		// TODO: implement waitForReady; either in Controller or in API
		function _waitForReady(func) {
			return function() {
				func.apply(this, arguments);
			}
		}
		
		this.play = _waitForReady(_play);
		this.pause = _waitForReady(_pause);
		this.seek = _waitForReady(_seek);
		this.stop = _waitForReady(_stop);
		this.load = _waitForReady(_load);
		this.next = _waitForReady(_next);
		this.prev = _waitForReady(_prev);
		this.item = _waitForReady(_item);
		this.setVolume = _waitForReady(_setVolume);
		this.setMute = _waitForReady(_setMute);
		this.setFullscreen = _waitForReady(_setFullscreen);
		this.setStretching = _waitForReady(_setStretching);
		
/*		this.playerReady = _playerReady;
		this.detachMedia = _detachMedia; 
		this.attachMedia = _attachMedia;
		this.beforePlay = function() { 
			return _preplay; 
		}
*/		
		
		_init();
	}
})(jwplayer.html5);

