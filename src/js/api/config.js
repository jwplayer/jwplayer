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

            if (config.skin.name) {
                config.skin = config.skin.name;
            } else {
                // we actively delete the value so it won't overwrite the model's default
                delete config.skin;
            }
        }

        if (_.isString(config.skin) && config.skin.indexOf('.xml') > 0) {
            console.log('JW Player does not support XML skins, please update your config');
            config.skin = config.skin.replace('.xml', '');
        }

        if (!config.aspectratio) {
            delete config.aspectratio;
        }

        if (!config.playlist) {
            // This is a legacy fallback, assuming a playlist item has been flattened into the config
            //  we clone it to avoid circular dependences
            config.playlist = _.clone(config);
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
