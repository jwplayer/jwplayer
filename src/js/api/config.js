import { loadFrom, getScriptPath } from 'utils/playerutils';
import { serialize } from 'utils/parser';
import { isValidNumber, isNumber, pick, isBoolean } from 'utils/underscore';
import { Features } from 'environment/environment';

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
    displayPlaybackLabel: false,
    height: 360,
    liveTimeout: null,
    localization: {
        airplay: 'AirPlay',
        audioTracks: 'Audio Tracks',
        auto: 'Auto',
        buffer: 'Loading',
        cast: 'Chromecast',
        cc: 'Closed Captions',
        close: 'Close',
        copied: 'Copied',
        errors: {
            badConnection: 'This video cannot be played because of a problem with your internet connection.',
            cantLoadPlayer: 'Sorry, the video player failed to load.',
            cantPlayInBrowser: 'The video cannot be played in this browser.',
            cantPlayVideo: 'This video file cannot be played.',
            errorCode: 'Error Code',
            liveStreamDown: 'The live stream is either down or has ended.',
            protectedContent: 'There was a problem providing access to protected content.',
            technicalError: 'This video cannot be played because of a technical error.'
        },
        fullscreen: 'Fullscreen',
        hd: 'Quality',
        liveBroadcast: 'Live',
        loadingAd: 'Loading ad',
        logo: 'Logo',
        more: 'More',
        next: 'Next',
        nextUp: 'Next Up',
        nextUpClose: 'Next Up Close',
        notLive: 'Not Live',
        off: 'Off',
        pause: 'Pause',
        player: 'Video Player',
        play: 'Play',
        playback: 'Play',
        playbackRates: 'Playback Rates',
        playlist: 'Playlist',
        poweredBy: 'Powered by',
        prev: 'Previous',
        related: 'More Videos',
        replay: 'Replay',
        rewind: 'Rewind 10 Seconds',
        slider: 'Seek Slider',
        settings: 'Settings',
        stop: 'Stop',
        sharing: {
            email: 'Email',
            embed: 'Embed',
            link: 'Link',
            share: 'Share'
        },
        videoInfo: 'About This Video',
        volume: 'Volume',
        volumeSlider: 'Volume Slider'
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
    if (isValidNumber(parsedEstimate)) {
        return Math.max(parsedEstimate, 1);
    }

    return Defaults.bandwidthEstimate;
}

const Config = function(options, persisted) {
    let allOptions = Object.assign({}, (window.jwplayer || {}).defaults, persisted, options);

    _deserialize(allOptions);

    allOptions.localization = Object.assign({}, Defaults.localization, allOptions.localization);
    allOptions.localization.errors = Object.assign({}, Defaults.localization.errors, allOptions.localization.errors);

    let config = Object.assign({}, Defaults, allOptions);
    if (config.base === '.') {
        config.base = getScriptPath('jwplayer.js');
    }
    config.base = (config.base || loadFrom()).replace(/\/?$/, '/');
    __webpack_public_path__ = config.base;
    config.width = _normalizeSize(config.width);
    config.height = _normalizeSize(config.height);
    config.aspectratio = _evaluateAspectRatio(config.aspectratio, config.width);
    config.volume = isValidNumber(config.volume) ? Math.min(Math.max(0, config.volume), 100) : Defaults.volume;
    config.mute = !!config.mute;

    let rateControls = config.playbackRateControls;

    if (rateControls) {
        let rates = config.playbackRates;

        if (Array.isArray(rateControls)) {
            rates = rateControls;
        }
        rates = rates.filter(rate => isNumber(rate) && rate >= 0.25 && rate <= 4)
            .map(rate => Math.round(rate * 100) / 100);

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
        const obj = pick(config, [
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
        if (!isValidNumber(liveTimeout)) {
            liveTimeout = null;
        } else if (liveTimeout !== 0) {
            liveTimeout = Math.max(30, liveTimeout);
        }
        config.liveTimeout = liveTimeout;
    }

    const parsedBwEstimate = parseFloat(config.bandwidthEstimate);
    const parsedBitrateSelection = parseFloat(config.bitrateSelection);
    config.bandwidthEstimate = isValidNumber(parsedBwEstimate) ? parsedBwEstimate : _adjustDefaultBwEstimate(config.defaultBandwidthEstimate);
    config.bitrateSelection = isValidNumber(parsedBitrateSelection) ? parsedBitrateSelection : Defaults.bitrateSelection;

    config.backgroundLoading = isBoolean(config.backgroundLoading) ? config.backgroundLoading : Features.backgroundLoading;
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
