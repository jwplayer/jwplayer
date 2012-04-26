/**
 * JW Player playlist loader
 *
 * @author pablo
 * @version 6.0
 */
(function(html5) {
	var _jw = jwplayer, _utils = _jw.utils, _events = _jw.events;

	html5.playlistloader = function() {
		var _eventDispatcher = new _events.eventdispatcher();
		_utils.extend(this, _eventDispatcher);
		
		this.load = function(playlistfile) {
			_utils.ajax(playlistfile, _playlistLoaded, _playlistError)
		}
		
		function _playlistLoaded(loadedEvent) {
			try {
				var playlistObj = html5.parsers.rssparser.parse(loadedEvent.responseXML.firstChild);
				_eventDispatcher.sendEvent(_events.JWPLAYER_PLAYLIST_LOADED, {
					"playlist": new html5.playlist(playlistObj)
				});
			} catch (e) {
				_playlistError('Could not load the playlist.');
			}
		}
		
		function _playlistError(msg) {
			_eventDispatcher.sendEvent(_events.JWPLAYER_ERROR, {
				message: msg ? msg : 'Could not load playlist an unknown reason.'
			});
		}
	}
})(jwplayer.html5);