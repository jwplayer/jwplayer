define([
    'utils/helpers',
    'playlist/playlist',
    'utils/underscore'
], function(utils, Playlist, _) {

    var Defaults = {
        width: 480,
        height: 270,
        cookies: true
    };

    function _deserialize(options) {
        _.each(options, function(val, key) {
            options[key] = utils.serialize(val);
        });
    }

    function _normalizeSize(val) {
        if (val.slice && val.slice(-2) === 'px') {
            val = val.slice(0,-2);
        }
        return val;
    }

    var config = function(options) {

        var allOptions = _.extend({}, (window.jwplayer || {}).defaults, options);

        _deserialize(allOptions);

        var config = _.extend({}, Defaults, allOptions);
        config.width  = _normalizeSize(config.width);
        config.height = _normalizeSize(config.height);
        config.base = config.base || utils.getScriptPath('jwplayer.js');
        config.flashplayer = config.flashplayer || config.base + 'jwplayer.flash.swf';
        config.aspectratio = _evaluateAspectRatio(config.aspectratio, config.width);

        if (_.isObject(config.skin)) {
            config.skinUrl = config.skin.url;
            config.skinColorInactive = config.skin.inactive; // default icon color
            config.skinColorActive = config.skin.active;  // icon hover, on, slider color
            config.skinColorBackground = config.skin.background; // control elements background
            config.skin = config.skin.name;
        }

        if (!config.aspectratio) {
            delete config.aspectratio;
        }

        if (_.isString(config.playlist)) {
            // If playlist is a string, then it's an RSS feed, let it be
        } else {
            // Else use the playlist obj/array or generate it from config
            config.playlist = Playlist(config.playlist || config);
        }

        return config;
    };


    function _evaluateAspectRatio(ar, width) {
        if (width.toString().indexOf('%') === -1) {
            return 0;
        }
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
