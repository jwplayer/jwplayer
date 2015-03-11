define([
    'api/global-api',
    '../css/styles.less',
    '../less/jwplayer.less'
], function (Api) {
    var jwplayer = function () {
        return Api.selectPlayer.apply(this, arguments);
    };

    // This is replaced by compiler
    jwplayer.version = __BUILD_VERSION__;
    jwplayer.api = Api;
    jwplayer.vid = document.createElement('video');

    if (!window.jwplayer) {
        window.jwplayer = jwplayer;
    }

    return jwplayer;
});