if (!window.jwplayer) {

    window.jwplayer = {};
    window.jwplayer.version = 'X.Y.ZZZZ';

    define(['api/api'], function (Api) {
        window.jwplayer = function () {
            return Api.selectPlayer.apply(this, arguments);
        };

        window.jwplayer.version = 'X.Y.ZZZZ';
        window.jwplayer.vid = document.createElement('video');
    });
}
