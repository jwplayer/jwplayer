define([
    'jwplayer',
    'view/view',
    'view/skin'
], function (jwplayer, View, Skin) {
    if (!window.jwplayer) {
        window.jwplayer = jwplayer;
        window.jwplayer.View = View;
        window.jwplayer.View.Skin = Skin;
    }
});