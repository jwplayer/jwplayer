/**
 * JW Player playlist loader
 *
 * @author pablo
 * @version 6.0
 */
(function(playlist) {
	var _jw = jwplayer, utils = _jw.utils, events = _jw.events, parsers = _jw.parsers;

	playlist.loader = function() {
		var _eventDispatcher = new events.eventdispatcher();
		utils.extend(this, _eventDispatcher);
		
		this.load = function(playlistfile) {
			utils.ajax(playlistfile, _playlistLoaded, _playlistLoadError);
		}
		
		function _playlistLoaded(loadedEvent) {
			try {
				var childNodes = loadedEvent.responseXML.childNodes;
				var rss = "";
				for (var i = 0; i < childNodes.length; i++) {
					rss = childNodes[i];
					if (rss.nodeType != 8) { // 8: Node.COMMENT_NODE (IE8 doesn't have the Node.COMMENT_NODE constant)
						break;
					}
				}
				
				if (parsers.localName(rss) == "xml") {
					rss = rss.nextSibling;
				}
				
				if (parsers.localName(rss) != "rss") {
					_playlistError("Not a valid RSS feed");
					return;
				}
				
				var pl = new playlist(parsers.rssparser.parse(rss));
				_eventDispatcher.sendEvent(events.JWPLAYER_PLAYLIST_LOADED, {
					playlist: pl
				});
			} catch (e) {
				_playlistError();
			}
		}
		
		function _playlistLoadError(err) {
			_playlistError(err.match(/invalid/i) ? "Not a valid RSS feed" : "");
		}
		
		function _playlistError(msg) {
			_eventDispatcher.sendEvent(events.JWPLAYER_ERROR, {
				message: msg ? msg : 'Error loading file'
			});
		}
	}
})(jwplayer.playlist);