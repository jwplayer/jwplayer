(function(jwplayer) {
    var events = jwplayer.events,
        utils = jwplayer.utils,
        _ = jwplayer._,
        states = events.state;

    jwplayer.api.instream = function(_api, _player) {

        var events = utils.extend({}, jwplayer.utils.Events);

        var _item,
            _options,
            _this = this;

        this.type = 'instream';

        _this.init = function() {
            _api.callInternal('jwInitInstream');
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

        // EVENTS
        var legacyMaps = {
            onError: events.JWPLAYER_ERROR,
            onMediaError: events.JWPLAYER_ERROR,
            onFullscreen: events.JWPLAYER_FULLSCREEN,
            onMeta: events.JWPLAYER_MEDIA_META,
            onMute: events.JWPLAYER_MEDIA_MUTE,
            onComplete: events.JWPLAYER_MEDIA_COMPLETE,
            onPlaylistComplete: events.JWPLAYER_PLAYLIST_COMPLETE,
            onPlaylistItem: events.JWPLAYER_PLAYLIST_ITEM,
            onTime: events.JWPLAYER_MEDIA_TIME,
            onClick: events.JWPLAYER_INSTREAM_CLICK,
            onInstreamDesrtoyed: events.JWPLAYER_INSTREAM_DESTROYED,
            onAdSkipped: events.JWPLAYER_AD_SKIPPED,

            onBuffer : states.BUFFERING,
            onPlay : states.PLAYING,
            onPause : states.PAUSED,
            onIdle : states.IDLE
        };

        _.each(legacyMaps, function(event, api) {
            _this[api] = function(callback) {
                events.on(event, callback);
            };
        });

        // STATE EVENTS
        events.on(events.JWPLAYER_PLAYER_STATE, function(evt) {
            events.trigger(evt.newstate, evt);
        });

        _this.removeEvents = events.off;
        _this.removeEventListener = events.off;
        _this.dispatchEvent = events.trigger;

    };
})(jwplayer);
