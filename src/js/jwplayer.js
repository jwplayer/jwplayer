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

    if (!window.jwplayer) {
        window.jwplayer = jwplayer;
    }

    return jwplayer;
});