(function(jwplayer) {
    var utils = jwplayer.utils,
        embed = jwplayer.embed,
        playlistitem = jwplayer.playlist.item;

    var config = embed.config = function(config) {

        var _defaults = {
                fallback: true, // enable download embedder
                height: 270,
                primary: 'html5',
                width: 480,
                base: config.base ? config.base : utils.getScriptPath('jwplayer.js'),
                aspectratio: ''
            },
            _config = utils.extend({}, _defaults, jwplayer.defaults, config),
            _modes = {
                html5: {
                    type: 'html5',
                    src: _config.base + 'jwplayer.html5.js'
                },
                flash: {
                    type: 'flash',
                    src: _config.base + 'jwplayer.flash.swf'
                }
            };

        // No longer allowing user-set modes block as of 6.0
        _config.modes = (_config.primary === 'flash') ? [_modes.flash, _modes.html5] : [_modes.html5, _modes.flash];

        if (_config.listbar) {
            _config.playlistsize = _config.listbar.size;
            _config.playlistposition = _config.listbar.position;
            _config.playlistlayout = _config.listbar.layout;
        }

        if (_config.flashplayer) { _modes.flash.src = _config.flashplayer; }
        if (_config.html5player) { _modes.html5.src = _config.html5player; }

        _normalizePlaylist(_config);

        evaluateAspectRatio(_config);

        return _config;
    };

    function evaluateAspectRatio(config) {
        var ar = config.aspectratio,
            ratio = getRatio(ar);
        if (config.width.toString().indexOf('%') === -1) {
            delete config.aspectratio;
        } else if (!ratio) {
            delete config.aspectratio;
        } else {
            config.aspectratio = ratio;
        }
    }

    function getRatio(ar) {
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

    /** Appends a new configuration onto an old one; used for mode configuration **/
    config.addConfig = function(oldConfig, newConfig) {
        _normalizePlaylist(newConfig);
        return utils.extend(oldConfig, newConfig);
    };

    /** Construct a playlist from base-level config elements **/
    function _normalizePlaylist(config) {
        if (!config.playlist) {
            var singleItem = {};

            utils.foreach(playlistitem.defaults, function(itemProp) {
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

            config.playlist = [new playlistitem(singleItem)];
        } else {
            // Use JW Player playlist items to normalize sources of existing playlist items
            for (var i = 0; i < config.playlist.length; i++) {
                config.playlist[i] = new playlistitem(config.playlist[i]);
            }
        }
    }

    function _moveProperty(sourceObj, destObj, property) {
        if (utils.exists(sourceObj[property])) {
            destObj[property] = sourceObj[property];
            delete sourceObj[property];
        }
    }

})(jwplayer);
