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
			utils.ajax(playlistfile, _playlistLoaded, _playlistLoadError);
		}
		
		function _playlistLoaded(loadedEvent) {
			try {
				var rss = loadedEvent.responseXML.firstChild;
				if (html5.parsers.localName(rss) == "xml") {
					rss = rss.nextSibling;
				}
				
				
				if (html5.parsers.localName(rss) != "rss") {
					_playlistError("Not a valid RSS feed");
					return;
				}
				
				var playlist = new _jw.playlist(html5.parsers.rssparser.parse(rss));
				playlist = _filterPlaylist(playlist);
				if (playlist && playlist.length && playlist[0].sources && playlist[0].sources.length && playlist[0].sources[0].file) {
					_eventDispatcher.sendEvent(events.JWPLAYER_PLAYLIST_LOADED, {
						playlist: playlist
					});
				} else {
					_playlistError("No playable sources found");
				}
			} catch (e) {
				_playlistError();
			}
		}
		
		function _filterPlaylist(list) {
			if (!list) return;
			var newList = [], i, item, sources;
			for (i=0; i < list.length; i++) {
				item = list[i];
				sources = utils.filterSources(item.sources);
				
				if (sources && sources.length) {
					item.sources = sources;
					newList.push(item);
				}
			}
			return newList;
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
})(jwplayer.html5);