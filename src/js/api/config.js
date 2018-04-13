import _ from 'utils/underscore';
import { loadFrom, getScriptPath } from 'utils/playerutils';
import { serialize } from 'utils/parser';
import { _isValidNumber } from 'utils/underscore';

/* global __webpack_public_path__:true */
/* eslint camelcase: 0 */
// Defaults
// Alphabetical order
const Defaults = {
    autostart: false,
    bandwidthEstimate: null,
    bitrateSelection: null,
    castAvailable: false,
    controls: true,
    defaultPlaybackRate: 1,
    displaydescription: true,
    displaytitle: true,
    height: 360,
    liveTimeout: null,
    localization: {
        player: 'Video Player',
        play: 'Play',
        playback: 'Start Playback',
        pause: 'Pause',
        stop: 'Stop',
        volume: 'Volume',
        prev: 'Previous',
        next: 'Next',
        cast: 'Chromecast',
        airplay: 'AirPlay',
        fullscreen: 'Fullscreen',
        playlist: 'Playlist',
        hd: 'Quality',
        cc: 'Closed Captions',
        audioTracks: 'Audio Tracks',
        playbackRates: 'Playback Rates',
        replay: 'Replay',
        buffer: 'Loading',
        more: 'More',
        liveBroadcast: 'Live',
        loadingAd: 'Loading ad',
        rewind: 'Rewind 10 Seconds',
        nextUp: 'Next Up',
        nextUpClose: 'Next Up Close',
        related: 'More Videos',
        close: 'Close',
        settings: 'Settings',
        unmute: 'Unmute',
        copied: 'Copied',
        videoInfo: 'About this video'
    },
    mute: false,
    nextUpDisplay: true,
    playbackRateControls: false,
    playbackRates: [0.5, 1, 1.25, 1.5, 2],
    renderCaptionsNatively: false,
    repeat: false,
    stretching: 'uniform',
    volume: 90,
    width: 640
};

function _deserialize(options) {
    Object.keys(options).forEach((key) => {
        if (key === 'id') {
            return;
        }
        options[key] = serialize(options[key]);
    });
}

function _normalizeSize(val) {
    if (val.slice && val.slice(-2) === 'px') {
        val = val.slice(0, -2);
    }
    return val;
}


function _adjustDefaultBwEstimate(estimate) {
    const parsedEstimate = parseFloat(estimate);
    if (_isValidNumber(parsedEstimate)) {
        return Math.max(parsedEstimate, 1);
    }

    return Defaults.bandwidthEstimate;
}

const Config = function(options, persisted) {
    let allOptions = Object.assign({}, (window.jwplayer || {}).defaults, persisted, options);

    _deserialize(allOptions);

    allOptions.localization = Object.assign({}, Defaults.localization, allOptions.localization);

    let config = Object.assign({}, Defaults, allOptions);
    if (config.base === '.') {
        config.base = getScriptPath('jwplayer.js');
    }
    config.base = (config.base || loadFrom()).replace(/\/?$/, '/');
    __webpack_public_path__ = config.base;
    config.width = _normalizeSize(config.width);
    config.height = _normalizeSize(config.height);

    config.aspectratio = _evaluateAspectRatio(config.aspectratio, config.width);

    let rateControls = config.playbackRateControls;

    if (rateControls) {
        let rates = config.playbackRates;

        if (Array.isArray(rateControls)) {
            rates = rateControls;
        }
        rates = rates.filter(rate => _.isNumber(rate) && rate >= 0.25 && rate <= 4)
            .map(rate => Math.round(rate * 4) / 4);

        if (rates.indexOf(1) < 0) {
            rates.push(1);
        }
        rates.sort();

        config.playbackRateControls = true;
        config.playbackRates = rates;
    }

    // Set defaultPlaybackRate to 1 if the value from storage isn't in the playbackRateControls menu
    if (!config.playbackRateControls || config.playbackRates.indexOf(config.defaultPlaybackRate) < 0) {
        config.defaultPlaybackRate = 1;
    }

    config.playbackRate = config.defaultPlaybackRate;

    if (!config.aspectratio) {
        delete config.aspectratio;
    }

    const configPlaylist = config.playlist;
    if (!configPlaylist) {
        // This is a legacy fallback, assuming a playlist item has been flattened into the config
        const obj = _.pick(config, [
            'title',
            'description',
            'type',
            'mediaid',
            'image',
            'file',
            'sources',
            'tracks',
            'preload',
            'duration'
        ]);

        config.playlist = [ obj ];
    } else if (Array.isArray(configPlaylist.playlist)) {
        // The "playlist" in the config is actually a feed that contains a playlist
        config.feedData = configPlaylist;
        config.playlist = configPlaylist.playlist;
    }

    config.qualityLabels = config.qualityLabels || config.hlslabels;
    delete config.duration;

    let liveTimeout = config.liveTimeout;
    if (liveTimeout !== null) {
        if (!_isValidNumber(liveTimeout)) {
            liveTimeout = null;
        } else if (liveTimeout !== 0) {
            liveTimeout = Math.max(30, liveTimeout);
        }
        config.liveTimeout = liveTimeout;
    }

    const parsedBwEstimate = parseFloat(config.bandwidthEstimate);
    const parsedBitrateSelection = parseFloat(config.bitrateSelection);
    config.bandwidthEstimate = _isValidNumber(parsedBwEstimate) ? parsedBwEstimate : _adjustDefaultBwEstimate(config.defaultBandwidthEstimate);
    config.bitrateSelection = _isValidNumber(parsedBitrateSelection) ? parsedBitrateSelection : Defaults.bitrateSelection;
    return config;
};

function _evaluateAspectRatio(ar, width) {
    if (width.toString().indexOf('%') === -1) {
        return 0;
    }
    if (typeof ar !== 'string' || !ar) {
        return 0;
    }
    if (/^\d*\.?\d+%$/.test(ar)) {
        return ar;
    }
    const index = ar.indexOf(':');
    if (index === -1) {
        return 0;
    }
    const w = parseFloat(ar.substr(0, index));
    const h = parseFloat(ar.substr(index + 1));
    if (w <= 0 || h <= 0) {
        return 0;
    }
    return (h / w * 100) + '%';
}

export default Config;
