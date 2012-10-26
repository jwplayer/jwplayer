/**
 * JW Player namespace definition
 * @version 6.0
 */
jwplayer = function(container) {
	if (jwplayer.api) {
		return jwplayer.api.selectPlayer(container);
	}
};

jwplayer.version = '6.0.2790';

// "Shiv" method for older IE browsers; required for parsing media tags
jwplayer.vid = document.createElement("video");
jwplayer.audio = document.createElement("audio");
jwplayer.source = document.createElement("source");