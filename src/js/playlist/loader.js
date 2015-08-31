define([
    'parsers/parsers',
    'parsers/rssparser',
    'utils/helpers',
    'events/events',
    'utils/backbone.events',
    'utils/underscore'
], function(parsers, rssParser, utils, events, Events, _) {

    var PlaylistLoader = function() {
        var _this = _.extend(this, Events),
            _xhr;

        this.load = function(playlistfile) {
            _xhr = utils.ajax(playlistfile, _playlistLoaded, _playlistLoadError);
        };

        this.destroy = function() {
            this.off();
            _xhr = null;
        };

        function _playlistLoaded(loadedEvent) {
            var status = utils.tryCatch(function() {
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

                var pl = rssParser.parse(rss);
                _this.trigger(events.JWPLAYER_PLAYLIST_LOADED, {
                    playlist: pl
                });
            });

            if (status instanceof utils.Error) {
                _playlistError();
            }
        }

        function _playlistLoadError(err) {
            _playlistError(err.match(/invalid/i) ? 'Not a valid RSS feed' : '');
        }

        function _playlistError(msg) {
            _this.trigger(events.JWPLAYER_ERROR, {
                message: msg ? msg : 'Error loading file'
            });
        }
    };

    return PlaylistLoader;
});
