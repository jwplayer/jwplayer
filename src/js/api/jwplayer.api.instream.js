(function(jwplayer) {
    var events = jwplayer.events,
        utils = jwplayer.utils,
        states = events.state;

    jwplayer.api.instream = function(_api, _player) {

        var events = utils.extend({}, jwplayer.utils.Events);

        var _item,
            _options,
            _this = this;

        _this.type = 'instream';

        _this.init = function() {
            _api.callInternal('jwInitInstream');
            return _this;
        };
        _this.loadItem = function(item, options) {
            _item = item;
            _options = options || {};
            if (utils.typeOf(item) === 'array') {
                _api.callInternal('jwLoadArrayInstream', _item, _options);
            } else {
                _api.callInternal('jwLoadItemInstream', _item, _options);
            }
        };

        _this.onError = function(callback) {
            return _eventListener(events.JWPLAYER_ERROR, callback);
        };
        _this.onMediaError = function(callback) {
            return _eventListener(events.JWPLAYER_MEDIA_ERROR, callback);
        };
        _this.onFullscreen = function(callback) {
            return _eventListener(events.JWPLAYER_FULLSCREEN, callback);
        };
        _this.onMeta = function(callback) {
            return _eventListener(events.JWPLAYER_MEDIA_META, callback);
        };
        _this.onMute = function(callback) {
            return _eventListener(events.JWPLAYER_MEDIA_MUTE, callback);
        };
        _this.onComplete = function(callback) {
            return _eventListener(events.JWPLAYER_MEDIA_COMPLETE, callback);
        };
        // _this.onSeek = function(callback) {
        //    return _eventListener(events.JWPLAYER_MEDIA_SEEK, callback);
        // };

        _this.onPlaylistComplete = function(callback) {
            return _eventListener(events.JWPLAYER_PLAYLIST_COMPLETE, callback);
        };

        _this.onPlaylistItem = function(callback) {
            return _eventListener(events.JWPLAYER_PLAYLIST_ITEM, callback);
        };

        _this.onTime = function(callback) {
            return _eventListener(events.JWPLAYER_MEDIA_TIME, callback);
        };
        // _this.onVolume = function(callback) {
        // return _eventListener(events.JWPLAYER_MEDIA_VOLUME, callback);
        // };
        // State events
        _this.onBuffer = function(callback) {
            return _stateListener(states.BUFFERING, callback);
        };
        _this.onPause = function(callback) {
            return _stateListener(states.PAUSED, callback);
        };
        _this.onPlay = function(callback) {
            return _stateListener(states.PLAYING, callback);
        };
        _this.onIdle = function(callback) {
            return _stateListener(states.IDLE, callback);
        };
        // Instream events
        _this.onClick = function(callback) {
            return _eventListener(events.JWPLAYER_INSTREAM_CLICK, callback);
        };
        _this.onInstreamDestroyed = function(callback) {
            return _eventListener(events.JWPLAYER_INSTREAM_DESTROYED, callback);
        };
        _this.onAdSkipped = function(callback) {
            return _eventListener(events.JWPLAYER_AD_SKIPPED, callback);
        };
        _this.play = function(state) {
            _player.jwInstreamPlay(state);
        };
        _this.pause = function(state) {
            _player.jwInstreamPause(state);
        };
        _this.hide = function() {
            _api.callInternal('jwInstreamHide');
        };
        _this.destroy = function() {
            _this.removeEvents();
            _api.callInternal('jwInstreamDestroy');
        };
        _this.setText = function(text) {
            _player.jwInstreamSetText(text ? text : '');
        };
        _this.getState = function() {
            return _player.jwInstreamState();
        };
        _this.setClick = function(url) {
            //only present in flashMode
            if (_player.jwInstreamClick) {
                _player.jwInstreamClick(url);
            }
        };






    function _eventListener(type, callback) {
        events.on(type, callback);
        events.on(type, _player.dispatchInstreamEvent);
    }

    function _stateListener(state, callback) {
        events.on(events.JWPLAYER_PLAYER_STATE, function(evt) {
            if (evt === state) {
                callback.call(this, {
                    oldstate: evt.oldstate,
                    newstate: evt.newstate,
                    type: evt.type
                });
            }
        });
    }

    _this.removeEvents = events.off;
    _this.removeEventListener = events.off;
    _this.dispatchEvent = events.trigger;

    };
})(jwplayer);
