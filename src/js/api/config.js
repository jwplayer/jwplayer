define([
    'utils/helpers',
    'utils/underscore'
], function(utils, _) {
    /*global __webpack_public_path__:true*/

    // Defaults
    var Defaults = {
        //androidhls: true,
        autostart: false,
        controls: true,
        displaytitle : true,
        displaydescription: true,
        mobilecontrols: false,
        repeat: false,
        castAvailable: false,
        skin: 'seven',
        stretching: 'uniform',
        mute: false,
        volume: 90,
        width: 480,
        height: 270,
        audioMode: false,
        localization: {
            play: 'Play',
            playback: 'Start playback',
            pause: 'Pause',
            volume: 'Volume',
            prev: 'Previous',
            next: 'Next',
            cast: 'Chromecast',
            airplay: 'Airplay',
            fullscreen: 'Fullscreen',
            playlist: 'Playlist',
            hd: 'Quality',
            cc: 'Closed captions',
            audioTracks: 'Audio tracks',
            replay: 'Replay',
            buffer: 'Loading',
            more: 'More',
            liveBroadcast: 'Live broadcast',
            loadingAd: 'Loading ad',
            rewind: 'Rewind 10s',
            nextUp: 'Next Up',
            nextUpClose: 'Next Up Close',
            related: 'Related'
        },
        renderCaptionsNatively: false
        //qualityLabel: '480p',     // specify a default quality
        //captionLabel: 'English',  // specify a default Caption
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

    var config = function(options, storage) {
        var persisted = storage && storage.getAllItems();
        var allOptions = _.extend({}, (window.jwplayer || {}).defaults, persisted, options);

        _deserialize(allOptions);

        allOptions.localization = _.extend({}, Defaults.localization, allOptions.localization);

        var config = _.extend({}, Defaults, allOptions);
        if (config.base === '.') {
            config.base = utils.getScriptPath('jwplayer.js');
        }
        config.base = (config.base || utils.loadFrom()).replace(/\/?$/, '/');
        __webpack_public_path__ = config.base;
        config.width  = _normalizeSize(config.width);
        config.height = _normalizeSize(config.height);
        var pathToFlash = (utils.getScriptPath('jwplayer.js') || config.base);
        config.flashplayer = config.flashplayer || pathToFlash + 'jwplayer.flash.swf';
        config.flashloader = config.flashloader || pathToFlash + 'jwplayer.loader.swf';

        // Non ssl pages can only communicate with flash when it is loaded
        //   from a non ssl location
        if (window.location.protocol === 'http:') {
            config.flashplayer = config.flashplayer.replace('https', 'http');
            config.flashloader = config.flashloader.replace('https', 'http');
        }

        config.aspectratio = _evaluateAspectRatio(config.aspectratio, config.width);

        if (_.isObject(config.skin)) {
            config.skinUrl = config.skin.url;
            config.skinColorInactive = config.skin.inactive; // default icon color
            config.skinColorActive = config.skin.active;  // icon hover, on, slider color
            config.skinColorBackground = config.skin.background; // control elements background
            config.skin = _.isString(config.skin.name) ? config.skin.name : Defaults.skin; // get skin name if it exists
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
            var obj = _.pick(config, [
                'title',
                'description',
                'type',
                'mediaid',
                'image',
                'file',
                'sources',
                'tracks',
                'preload'
            ]);

            config.playlist = [ obj ];
        }

        config.qualityLabels = config.qualityLabels || config.hlslabels;

        return config;
    };


    function _evaluateAspectRatio(ar, width) {
        if (width.toString().indexOf('%') === -1) {
            return 0;
        }
        if (typeof ar !== 'string' || !utils.exists(ar)) {
            return 0;
        }
        if (/^\d*\.?\d+%$/.test(ar)) {
            return ar;
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
