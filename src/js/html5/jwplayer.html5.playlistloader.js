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
			utils.ajax(playlistfile, _playlistLoaded, _playlistError)
		}
		
		function _playlistLoaded(loadedEvent) {
			try {
				var rss = loadedEvent.responseXML.firstChild;
				if (html5.parsers.localName(rss) == "xml") {
					rss = rss.nextSibling;
				}
				var playlistObj = html5.parsers.rssparser.parse(rss);
				_eventDispatcher.sendEvent(events.JWPLAYER_PLAYLIST_LOADED, {
					playlist: new _jw.playlist(playlistObj)
				});
			} catch (e) {
				_playlistError('Could not load the playlist.');
			}
		}
		
		function _playlistError(msg) {
			_eventDispatcher.sendEvent(events.JWPLAYER_ERROR, {
				message: msg ? msg : 'Could not load playlist an unknown reason.'
			});
		}
	}
})(jwplayer.html5);