define([
    'playlist/playlist',
    'parsers/parsers',
    'parsers/rssparser',
    'utils/helpers',
    'utils/eventdispatcher',
    'events/events',
    'underscore'
], function(Playlist, parsers, rssParser, utils, eventdispatcher, events, _) {

    var PlaylistLoader = function() {
        var _eventDispatcher = new eventdispatcher();
        _.extend(this, _eventDispatcher);

        this.load = function(playlistfile) {
            utils.ajax(playlistfile, _playlistLoaded, _playlistLoadError);
        };

        function _playlistLoaded(loadedEvent) {
            try {
                var childNodes = loadedEvent.responseXML.childNodes;
                var rss = '';
                for (var i = 0; i < childNodes.length; i++) {
                    rss = childNodes[i];
                    if (rss.nodeType !== 8) { // 8: Node.COMMENT_NODE (IE8 doesn't have the Node.COMMENT_NODE constant)
                        break;
                    }
                }

                if (parsers.localName(rss) === 'xml') {
                    rss = rss.nextSibling;
                }

                if (parsers.localName(rss) !== 'rss') {
                    _playlistError('Not a valid RSS feed');
                    return;
                }

                var pl = new Playlist(rssParser.parse(rss));
                _eventDispatcher.sendEvent(events.JWPLAYER_PLAYLIST_LOADED, {
                    playlist: pl
                });
            } catch (e) {
                _playlistError();
            }
        }

        function _playlistLoadError(err) {
            _playlistError(err.match(/invalid/i) ? 'Not a valid RSS feed' : '');
        }

        function _playlistError(msg) {
            _eventDispatcher.sendEvent(events.JWPLAYER_ERROR, {
                message: msg ? msg : 'Error loading file'
            });
        }
    };

    return PlaylistLoader;
});
