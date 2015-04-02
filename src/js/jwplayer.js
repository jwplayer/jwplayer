define([
    'api/global-api',
    'polyfill/bind',
    'polyfill/eventlisteners',
    '../css/styles.less',
    '../css/imports/errorscreen.less'
], function (GlobalApi) {
    var jwplayer = function () {
        return GlobalApi.selectPlayer.apply(GlobalApi, arguments);
    };

    // This is replaced by compiler
    jwplayer.version = __BUILD_VERSION__;
    jwplayer.vid = document.createElement('video');

    if (!window.jwplayer) {
        window.jwplayer = jwplayer;
    }

    return jwplayer;
});