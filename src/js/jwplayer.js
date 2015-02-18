/*global jwplayer:true*/
jwplayer = function() {
    if (jwplayer.api) {
        return jwplayer.api.selectPlayer.apply(this, arguments);
    }
};

jwplayer.version = 'X.Y.ZZZZ';
