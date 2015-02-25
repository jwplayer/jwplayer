define([
    'utils/helpers',
    'playlist/item',
    'underscore'
], function(utils, PlaylistItem, _) {

    var config = function (options) {

        options = options || {};

        var config = _.extend({}, {
            fallback: true, // enable download embedder
            width: 480,
            height: 270,
            aspectratio: '',
            primary: 'html5',
            base: options.base ? options.base : utils.getScriptPath('jwplayer.js')
        }, jwplayer.defaults, options);

        _normalizePlaylist(config);

        _evaluateAspectRatio(config);

        return config;
    };

    function _evaluateAspectRatio(config) {
        var ar = config.aspectratio,
            ratio = _getRatio(ar);
        if (config.width.toString().indexOf('%') === -1) {
            delete config.aspectratio;
        } else if (!ratio) {
            delete config.aspectratio;
        } else {
            config.aspectratio = ratio;
        }
    }

    function _getRatio(ar) {
        if (typeof ar !== 'string' || !utils.exists(ar)) {
            return 0;
        }
        var index = ar.indexOf(':');
        if (index === -1) {
            return 0;
        }
        var w = parseFloat(ar.substr(0, index)),
            h = parseFloat(ar.substr(index + 1));
        if (w <= 0 || h <= 0) {
            return 0;
        }
        return (h / w * 100) + '%';
    }

    /** Construct a playlist from base-level config elements **/
    function _normalizePlaylist(config) {
        if (!config.playlist) {
            var singleItem = {};

            utils.foreach(PlaylistItem.defaults, function (itemProp) {
                _moveProperty(config, singleItem, itemProp);
            });

            if (!singleItem.sources) {
                if (config.levels) {
                    singleItem.sources = config.levels;
                    delete config.levels;
                } else {
                    var singleSource = {};
                    _moveProperty(config, singleSource, 'file');
                    _moveProperty(config, singleSource, 'type');
                    singleItem.sources = singleSource.file ? [singleSource] : [];
                }
            }

            config.playlist = [new PlaylistItem(singleItem)];
        } else {
            // Use JW Player playlist items to normalize sources of existing playlist items
            for (var i = 0; i < config.playlist.length; i++) {
                config.playlist[i] = new PlaylistItem(config.playlist[i]);
            }
        }
    }

    function _moveProperty(sourceObj, destObj, property) {
        if (utils.exists(sourceObj[property])) {
            destObj[property] = sourceObj[property];
            delete sourceObj[property];
        }
    }

    return config;
});
