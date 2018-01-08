import { Browser, OS } from 'environment/environment';
import SimpleModel from 'model/simplemodel';
import { INITIAL_PLAYER_STATE, INITIAL_MEDIA_STATE } from 'model/player-model';
import { STATE_IDLE } from 'events/events';
import _ from 'utils/underscore';
import ProviderController from 'providers/provider-controller';
import { seconds } from 'utils/strings';

// Represents the state of the player
const Model = function() {
    const _this = this;
    let providerController;
    let _provider;
    this.mediaModel = new MediaModel();

    this.set('attached', true);
    this.set('mediaModel', this.mediaModel);

    this.setup = function(config) {
        Object.assign(this.attributes, config, INITIAL_PLAYER_STATE);
        providerController = ProviderController(this.getConfiguration());
        this.setAutoStart();
        return this;
    };

    this.getConfiguration = function() {
        const config = this.clone();
        const mediaModelAttributes = config.mediaModel.attributes;
        Object.keys(INITIAL_MEDIA_STATE).forEach(key => {
            config[key] = mediaModelAttributes[key];
        });
        delete config.instream;
        delete config.mediaModel;
        return config;
    };

    this.setQualityLevel = function(quality, levels) {
        if (quality > -1 && levels.length > 1) {
            this.mediaModel.set('currentLevel', parseInt(quality));
        }
    };

    this.persistQualityLevel = function(quality, levels) {
        var currentLevel = levels[quality] || {};
        var label = currentLevel.label;
        this.set('qualityLabel', label);
    };

    this.setActiveItem = function (index) {
        const item = this.get('playlist')[index];
        this.resetItem(item);
        this.attributes.playlistItem = null;
        this.set('item', index);
        this.set('minDvrWindow', item.minDvrWindow);
        this.set('playlistItem', item);
    };

    this.setMediaModel = function (mediaModel) {
        if (this.mediaModel && this.mediaModel !== mediaModel) {
            this.mediaModel.off();
        }

        mediaModel = mediaModel || new MediaModel();
        this.mediaModel = mediaModel;
        this.set('mediaModel', mediaModel);
        syncPlayerWithMediaModel(mediaModel);
    };

    this.setCurrentAudioTrack = function(currentTrack, tracks) {
        if (currentTrack > -1 && tracks.length > 0 && currentTrack < tracks.length) {
            this.mediaModel.set('currentAudioTrack', parseInt(currentTrack));
        }
    };

    this.destroy = function() {
        this.attributes._destroyed = true;
        this.off();
        if (_provider) {
            _provider.off(null, null, this);
            _provider.destroy();
        }
    };

    this.getVideo = function() {
        return _provider;
    };

    this.setFullscreen = function(state) {
        state = !!state;
        if (state !== _this.get('fullscreen')) {
            _this.set('fullscreen', state);
        }
    };

    this.getProviders = function() {
        return providerController.allProviders();
    };

    this.setVolume = function(volume) {
        volume = Math.round(volume);
        this.set('volume', volume);
        var mute = (volume === 0);
        if (mute !== (this.getMute())) {
            this.setMute(mute);
        }
    };

    this.getMute = function() {
        return this.get('autostartMuted') || this.get('mute');
    };

    this.setMute = function(mute) {
        if (mute === undefined) {
            mute = !(this.getMute());
        }
        this.set('mute', mute);
        if (!mute) {
            var volume = Math.max(10, this.get('volume'));
            this.set('autostartMuted', false);
            this.setVolume(volume);
        }
    };

    this.setStreamType = function(streamType) {
        this.set('streamType', streamType);
        if (streamType === 'LIVE') {
            this.setPlaybackRate(1);
        }
    };

    this.setProvider = function (provider) {
        _provider = provider;
        syncProviderProperties(this, provider);
    };

    this.resetProvider = function () {
        _provider = null;
        this.set('provider', undefined);
    };

    this.setPlaybackRate = function(playbackRate) {
        if (!_.isNumber(playbackRate)) {
            return;
        }

        // Clamp the rate between 0.25x and 4x
        playbackRate = Math.max(Math.min(playbackRate, 4), 0.25);

        if (this.get('streamType') === 'LIVE') {
            playbackRate = 1;
        }

        this.set('defaultPlaybackRate', playbackRate);

        if (_provider && _provider.setPlaybackRate) {
            _provider.setPlaybackRate(playbackRate);
        }
    };

    this.persistCaptionsTrack = function() {
        var track = this.get('captionsTrack');

        if (track) {
            // update preference if an option was selected
            this.set('captionLabel', track.name);
        } else {
            this.set('captionLabel', 'Off');
        }
    };


    this.setVideoSubtitleTrack = function(trackIndex, tracks) {
        this.set('captionsIndex', trackIndex);
        /*
         * Tracks could have changed even if the index hasn't.
         * Need to ensure track has data for captionsrenderer.
         */
        if (trackIndex && tracks && trackIndex <= tracks.length && tracks[trackIndex - 1].data) {
            this.set('captionsTrack', tracks[trackIndex - 1]);
        }
    };

    this.persistVideoSubtitleTrack = function(trackIndex, tracks) {
        this.setVideoSubtitleTrack(trackIndex, tracks);
        this.persistCaptionsTrack();
    };

    function _autoStartSupportedIOS() {
        if (!OS.iOS) {
            return false;
        }
        // Autostart only supported in iOS 10 or higher - check if the version is 9 or less
        return OS.version.major >= 10;
    }

    function platformCanAutostart() {
        var autostartAdsIsEnabled = (!_this.get('advertising') || _this.get('advertising').autoplayadsmuted);
        var iosBrowserIsSupported = _autoStartSupportedIOS() && (Browser.safari || Browser.chrome || Browser.facebook);
        var androidBrowserIsSupported = OS.android && Browser.chrome;
        var mobileBrowserIsSupported = (iosBrowserIsSupported || androidBrowserIsSupported);
        var isAndroidSdk = _this.get('sdkplatform') === 1;
        return (!_this.get('sdkplatform') && autostartAdsIsEnabled && mobileBrowserIsSupported) || isAndroidSdk;
    }

    this.autoStartOnMobile = function() {
        return this.get('autostart') && platformCanAutostart();
    };

    // Mobile players always wait to become viewable.
    // Desktop players must have autostart set to viewable
    this.setAutoStart = function(autoStart) {
        if (autoStart !== undefined) {
            this.set('autostart', autoStart);
        }

        const autoStartOnMobile = this.autoStartOnMobile();
        const isAndroidSdk = _this.get('sdkplatform') === 1;
        if (autoStartOnMobile && !isAndroidSdk) {
            this.set('autostartMuted', true);
        }
        this.set('playOnViewable', autoStartOnMobile || this.get('autostart') === 'viewable');
    };

    this.resetItem = function (item) {
        const position = item ? seconds(item.starttime) : 0;
        const duration = item ? seconds(item.duration) : 0;
        const mediaModel = this.mediaModel;
        this.set('playRejected', false);
        this.attributes.itemMeta = {};
        mediaModel.set('position', position);
        mediaModel.set('duration', duration);
    };
};

const syncProviderProperties = (model, provider) => {
    model.set('provider', provider.getName());
    if (model.get('instreamMode') === true) {
        provider.instreamMode = true;
    }

    if (provider.getName().name.indexOf('flash') === -1) {
        model.set('flashThrottle', undefined);
        model.set('flashBlocked', false);
    }

    // Attempt setting the playback rate to be the user selected value
    model.setPlaybackRate(model.get('defaultPlaybackRate'));

    // Set playbackRate because provider support for playbackRate may have changed and not sent an update
    model.set('supportsPlaybackRate', provider.supportsPlaybackRate);
    model.set('playbackRate', provider.getPlaybackRate());
    model.set('renderCaptionsNatively', provider.renderNatively);
};

function syncPlayerWithMediaModel(mediaModel) {
    // Sync player state with mediaModel state
    const mediaState = mediaModel.get('mediaState');
    mediaModel.trigger('change:mediaState', mediaModel, mediaState, mediaState);
}

// Represents the state of the provider/media element
const MediaModel = Model.MediaModel = function() {
    this.attributes = {
        mediaState: STATE_IDLE
    };
};

Object.assign(MediaModel.prototype, SimpleModel, {
    srcReset() {
        Object.assign(this.attributes, INITIAL_MEDIA_STATE, {
            setup: false,
            started: false,
            preloaded: false,
            visualQuality: null,
        });
    }
});

Object.assign(Model.prototype, SimpleModel);

export { MediaModel };
export default Model;
