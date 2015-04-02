define([
    'utils/backbone.events',
    'events/events',
    'underscore',
    'utils/helpers',
    'events/states'
], function(Events, EVENTS, _, utils, states) {

    var Instream = function(_controller) {

        var events = _.extend({}, Events);

        var _item,
            _options,
            _this = this;

        this.type = 'instream';

        _this.init = function() {
            _controller.initInstream();
            return _this;
        };
        _this.loadItem = function(item, options) {
            _item = item;
            _options = options || {};
            if (utils.typeOf(item) === 'array') {
                _controller.loadArrayInstream(_item, _options);
            } else {
                _controller.loadItemInstream(_item, _options);
            }
        };
        _this.play = function(state) {
            _controller.instreamPlay(state);
        };
        _this.pause = function(state) {
            _controller.instreamPause(state);
        };
        _this.hide = function() {
            //??
            // _controller.instreamHide();
        };
        _this.destroy = function() {
            _this.removeEvents();
            _controller.instreamDestroy();
        };
        _this.setText = function(text) {
            _controller.instreamSetText(text ? text : '');
        };
        _this.getState = function() {
            return _controller.instreamState();
        };
        _this.setClick = function(url) {
            //only present in flashMode
            if (_controller.instreamClick) {
                _controller.instreamClick(url);
            }
        };

        // EVENTS
        var legacyMaps = {
            onError: EVENTS.JWPLAYER_ERROR,
            onMediaError: EVENTS.JWPLAYER_ERROR,
            onFullscreen: EVENTS.JWPLAYER_FULLSCREEN,
            onMeta: EVENTS.JWPLAYER_MEDIA_META,
            onMute: EVENTS.JWPLAYER_MEDIA_MUTE,
            onComplete: EVENTS.JWPLAYER_MEDIA_COMPLETE,
            onPlaylistComplete: EVENTS.JWPLAYER_PLAYLIST_COMPLETE,
            onPlaylistItem: EVENTS.JWPLAYER_PLAYLIST_ITEM,
            onTime: EVENTS.JWPLAYER_MEDIA_TIME,
            onClick: EVENTS.JWPLAYER_INSTREAM_CLICK,
            onInstreamDestroyed: EVENTS.JWPLAYER_INSTREAM_DESTROYED,
            onAdSkipped: EVENTS.JWPLAYER_AD_SKIPPED,

            onBuffer : states.BUFFERING,
            onPlay : states.PLAYING,
            onPause : states.PAUSED,
            onIdle : states.IDLE
        };

        _.each(legacyMaps, function(event, api) {
            _this[api] = function(callback) {
                _controller.instreamAddEventListener(event, callback);
                events.on(event, callback);
                return _this;
            };
        });

        // STATE EVENTS
        events.on(EVENTS.JWPLAYER_PLAYER_STATE, function(evt) {
            events.trigger(evt.newstate, evt);
        });

        _this.removeEvents = events.off;
        _this.removeEventListener = events.off;
        _this.dispatchEvent = events.trigger;
    };

    return Instream;
});