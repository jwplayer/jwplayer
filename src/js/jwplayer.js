/**
 * JW Player namespace definition
 * @version 6.0
 */

/*global jwplayer:true*/
jwplayer = function() {
    if (jwplayer.api) {
        return jwplayer.api.selectPlayer.apply(this, arguments);
    }
};

jwplayer.version = 'X.Y.ZZZZ';

// "Shiv" method for older IE browsers; required for parsing media tags
jwplayer.vid = document.createElement('video');
jwplayer.audio = document.createElement('audio');
jwplayer.source = document.createElement('source');
