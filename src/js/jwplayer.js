/*global jwplayer:true*/

jwplayer.version = 'X.Y.ZZZZ';
define(['api/api'], function(Api) {
    window.jwplayer = function() {
        return Api.selectPlayer.apply(this, arguments);
    };
});

