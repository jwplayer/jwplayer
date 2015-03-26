define([
    'api/global-api',
    'events/events',
    'polyfill/bind',
    'polyfill/eventlisteners',
    '../css/styles.less',
    '../css/imports/errorscreen.less'
], function (Api, events) {
    var jwplayer = function () {
        return Api.selectPlayer.apply(this, arguments);
    };

    // This is replaced by compiler
    jwplayer.version = __BUILD_VERSION__;
    jwplayer.api = Api;
    jwplayer.events = events;
    jwplayer.vid = document.createElement('video');

    if (!window.jwplayer) {
        window.jwplayer = jwplayer;
    }

    return jwplayer;
});