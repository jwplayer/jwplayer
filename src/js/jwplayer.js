if (!window.jwplayer) {

    define(['api/global-api'], function (Api) {
        var jwplayer = function () {
            return Api.selectPlayer.apply(this, arguments);
        };

        // This is replaced by compiler
        jwplayer.version = __BUILD_VERSION__;
        jwplayer.api = Api;
        jwplayer.vid = document.createElement('video');

        window.jwplayer = jwplayer;
    });
}
