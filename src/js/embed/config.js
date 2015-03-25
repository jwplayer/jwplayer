define([
    'utils/helpers',
    'playlist/playlist',
    'underscore'
], function(utils, Playlist, _) {

    var Defaults = {
        width: 480,
        height: 270,
        aspectratio: '',
        //primary: 'html5',
        base: utils.getScriptPath('jwplayer.js')
    };

    function normalizeSize(val) {
        if (val.slice && val.slice(-2) === 'px') {
            val = val.slice(0,-2);
        }
        return val;
    }

    var config = function (options) {

        options = options || {};

        var config = _.extend({}, Defaults, jwplayer.defaults, options);
        config.width = normalizeSize(config.width);
        config.height = normalizeSize(config.height);


        _evaluateAspectRatio(config);

        if (_.isString(config.playlist)) {
            // If playlist is a string, then it's an RSS feed, let it be
        } else {
            // Else use the playlist obj/array or generate it from config
            config.playlist = Playlist(config.playlist || config);
        }

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


    return config;
});
