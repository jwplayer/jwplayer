/**
 * jwplayer.html5 model
 * 
 * @author pablo
 * @version 6.0
 */
(function(html5) {
	var _utils = jwplayer.utils;

	html5.model = function(config) {
		var _model = this, 
			// Video provider
			_video, 
			// HTML5 <video> tag
			_videoTag;

		_utils.extend(_model, new jwplayer.events.eventdispatcher());

		function _parseConfig(config) {
			return config;
		}

		function _init() {
			_utils.extend(_model, {
				id : config.id,
				settings : _parseConfig(config),
				volume : 0,
				state : jwplayer.events.state.IDLE,
				mute : false
			});

			_videoTag = document.createElement("video");
			_video = new html5.video(_videoTag);
			_video.addGlobalListener(_videoEventHandler);
		}

		function _videoEventHandler(evt) {
			switch (evt.type) {
			case jwplayer.events.JWPLAYER_MEDIA_MUTE:
				if (_model.mute == evt.mute)
					return;
				_model.mute = evt.mute;
				break;
			case jwplayer.events.JWPLAYER_MEDIA_VOLUME:
				if (_model.volume == evt.volume)
					return;
				_model.volume = evt.volume;
				break;
			case jwplayer.events.JWPLAYER_PLAYER_STATE:
				if (_model.state == evt.newstate)
					return;
				_model.state = evt.newstate;
			}
			_model.sendEvent(evt.type, evt);
		}
		
		this.getVideo = function() {
			return _video;
		}
		
		this.setFullscreen = function(state) {
			if (state != _model.fullscreen) {
				_model.fullscreen = state;
				_model.sendEvent(jwplayer.events.JWPLAYER_FULLSCREEN, { fullscreen: state } );
			}
		}
		
		_init();
	}
})(jwplayer.html5);
