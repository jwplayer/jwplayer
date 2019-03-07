import { loadFrom, getScriptPath } from 'utils/playerutils';
import { serialize } from 'utils/parser';
import { isValidNumber, isNumber, pick, isBoolean } from 'utils/underscore';
import { Features } from 'environment/environment';
import en from 'assets/translations/en.js';
import { getLanguage, getCustomLocalization, applyTranslation, normalizeIntl } from 'utils/language';

/* global __webpack_public_path__:true */
/* eslint camelcase: 0 */
// Defaults
// Alphabetical order
const Defaults = {
    autoPause: { viewability: false },
    autostart: false,
    bandwidthEstimate: null,
    bitrateSelection: null,
    castAvailable: false,
    controls: true,
    cues: [],
    defaultPlaybackRate: 1,
    displaydescription: true,
    displaytitle: true,
    displayPlaybackLabel: false,
    height: 360,
    intl: {},
    language: 'en',
    liveTimeout: null,
    localization: en,
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

    const language = allOptions.forceLocalizationDefaults ? Defaults.language : getLanguage();
    const intl = normalizeIntl(allOptions.intl);

    allOptions.localization = applyTranslation(en, getCustomLocalization(allOptions, intl, language));

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
    config.language = language;
    config.intl = intl;

    // If autoPause is configured with an empty block,
    // default autoPause.viewability to true.
    let autoPause = allOptions.autoPause;
    if (autoPause) {
        config.autoPause.viewability = ('viewability' in autoPause) ? !!autoPause.viewability : true;
    }

    // If floating is configured to be disabled,
    // remove the floating block from the config
    const floating = config.floating;
    if (floating && !!floating.disabled) {
        config.floating = null;
    }

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
