define([
    'utils/backbone.events',
    'events/events',
    'utils/underscore',
    'utils/helpers',
    'events/states'
], function(Events, events, _, utils, states) {

    var Instream = function(_controller) {

        var _item,
            _options,
            _this = _.extend(this, Events);

        this.type = 'instream';

        _this.init = function() {
            _controller.initInstream();
            // TODO: This triggers 'playing', 'paused', events VAST expects.  It VAST should listen to state instead.
            _controller._instreamPlayer.on('state', function(evt) {
                _this.trigger(evt.newstate, evt);
            });
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
            onInstreamDestroyed: events.JWPLAYER_INSTREAM_DESTROYED,
            onAdSkipped: events.JWPLAYER_AD_SKIPPED,

            onBuffer : states.BUFFERING,
            onPlay : states.PLAYING,
            onPause : states.PAUSED,
            onIdle : states.IDLE
        };

        _.each(legacyMaps, function(event, api) {
            _this[api] = function(callback) {
                _controller.instreamAddEventListener(event, callback);
                _this.on(event, callback);
                return _this;
            };
        });

        // STATE EVENTS
        _this.on(events.JWPLAYER_PLAYER_STATE, function(evt) {
            _this.trigger(evt.newstate, evt);
        });

        _this.removeEvents = _this.off;
        _this.removeEventListener = _this.off;
        _this.dispatchEvent = _this.trigger;
    };

    return Instream;
});