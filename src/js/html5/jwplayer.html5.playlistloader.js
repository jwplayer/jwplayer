/**
 * JW Player playlist loader
 *
 * @author pablo
 * @version 6.0
 */
(function(html5) {
	var _jw = jwplayer, utils = _jw.utils, events = _jw.events;

	html5.playlistloader = function() {
		var _eventDispatcher = new events.eventdispatcher();
		utils.extend(this, _eventDispatcher);
		
		this.load = function(playlistfile) {
			utils.ajax(playlistfile, _playlistLoaded, _playlistError);
		}
		
		function _playlistLoaded(loadedEvent) {
			alert("playlist loaded");
			try {
				var rss = loadedEvent.responseXML.firstChild;
				if (html5.parsers.localName(rss) == "xml") {
					rss = rss.nextSibling;
					alert(rss);
				}
				
				
				if (html5.parsers.localName(rss) != "rss") {
					_playlistError("Playlist is not a valid RSS feed.");
					return;
				}
				
				var playlist = new _jw.playlist(html5.parsers.rssparser.parse(rss));
				// TODO: full source inspection here - need to detect if there are playable sources in the list
				if (playlist && playlist.length && playlist[0].sources && playlist[0].sources.length && playlist[0].sources[0].file) {
					_eventDispatcher.sendEvent(events.JWPLAYER_PLAYLIST_LOADED, {
						playlist: playlist
					});
				} else {
					_playlistError("No playable sources found");
				}
			} catch (e) {
				_playlistError('Could not load the playlist.');
			}
		}
		
		function _playlistError(msg) {
			alert("playlist error");
			_eventDispatcher.sendEvent(events.JWPLAYER_ERROR, {
				message: msg ? msg : 'Could not load playlist an unknown reason.'
			});
		}
	}
})(jwplayer.html5);