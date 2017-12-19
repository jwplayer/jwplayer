import { Browser, OS } from 'environment/environment';
import SimpleModel from 'model/simplemodel';
import { INITIAL_PLAYER_STATE, INITIAL_MEDIA_STATE, INITIAL_SOURCE_STATE } from 'model/player-model';
import { STATE_IDLE } from 'events/events';
import _ from 'utils/underscore';
import ProviderController from 'providers/provider-controller';
import { seconds } from 'utils/strings';

// Represents the state of the player
class Model extends SimpleModel {

    constructor() {
        super();
        this.providerController = null;
        this._provider = null;
        this.addAttributes({
            mediaModel: new MediaModel()
        });
    }

    setup(config) {
        Object.assign(this.attributes, config);
        this.addAttributes(INITIAL_PLAYER_STATE);
        this.providerController = ProviderController(this.getConfiguration());
        this.setAutoStart();
        return this;
    }

    getConfiguration() {
        const config = this.clone();
        const mediaModelAttributes = config.mediaModel.attributes;
        Object.keys(INITIAL_MEDIA_STATE).forEach(key => {
            config[key] = mediaModelAttributes[key];
        });
        delete config.instream;
        delete config.mediaModel;
        return config;
    }

    setQualityLevel(quality, levels) {
        if (quality > -1 && levels.length > 1) {
            this.mediaModel.set('currentLevel', parseInt(quality));
        }
    }

    persistQualityLevel(quality, levels) {
        var currentLevel = levels[quality] || {};
        var label = currentLevel.label;
        this.set('qualityLabel', label);
    }

    setActiveItem (index) {
        const item = this.get('playlist')[index];
        this.resetItem(item);
        this.attributes.playlistItem = null;
        this.item = index;
        this.set('minDvrWindow', item.minDvrWindow);
        this.set('playlistItem', item);
        this.trigger('itemReady', item);
    }

    setMediaModel (mediaModel) {
        if (this.mediaModel && this.mediaModel !== mediaModel) {
            this.mediaModel.off();
        }

        mediaModel = mediaModel || new MediaModel();
        this.mediaModel = mediaModel;
        this.set('mediaModel', mediaModel);
        syncPlayerWithMediaModel(mediaModel);
    }

    setCurrentAudioTrack(currentTrack, tracks) {
        if (currentTrack > -1 && tracks.length > 0 && currentTrack < tracks.length) {
            this.mediaModel.set('currentAudioTrack', parseInt(currentTrack));
        }
    }

    destroy() {
        this.attributes._destroyed = true;
        this.off();
        if (this._provider) {
            this._provider.off(null, null, this);
            this._provider.destroy();
        }
    }

    getVideo() {
        return this._provider;
    }

    setFullscreen(state) {
        const fullscreen = !!state;
        if (fullscreen !== this.get('fullscreen')) {
            this.set('fullscreen', fullscreen);
        }
    }

    getProviders() {
        return this.providerController.allProviders();
    }

    setVolume(volume) {
        volume = Math.round(volume);
        this.set('volume', volume);
        var mute = (volume === 0);
        if (mute !== (this.getMute())) {
            this.setMute(mute);
        }
    }

    getMute() {
        return this.get('autostartMuted') || this.get('mute');
    }

    setMute(mute) {
        if (mute === undefined) {
            mute = !(this.getMute());
        }
        this.set('mute', mute);
        if (!mute) {
            var volume = Math.max(10, this.get('volume'));
            this.set('autostartMuted', false);
            this.setVolume(volume);
        }
    }

    setStreamType(streamType) {
        this.set('streamType', streamType);
        if (streamType === 'LIVE') {
            this.setPlaybackRate(1);
        }
    }

    setProvider (provider) {
        this._provider = provider;
        syncProviderProperties(this, provider);
    }

    resetProvider () {
        this._provider = null;
        this.set('provider', undefined);
    }

    setPlaybackRate(playbackRate) {
        if (!_.isNumber(playbackRate)) {
            return;
        }

        // Clamp the rate between 0.25x and 4x
        playbackRate = Math.max(Math.min(playbackRate, 4), 0.25);

        if (this.get('streamType') === 'LIVE') {
            playbackRate = 1;
        }

        this.set('defaultPlaybackRate', playbackRate);

        if (this._provider && this._provider.setPlaybackRate) {
            this._provider.setPlaybackRate(playbackRate);
        }
    }

    persistCaptionsTrack() {
        var track = this.get('captionsTrack');

        if (track) {
            // update preference if an option was selected
            this.set('captionLabel', track.name);
        } else {
            this.set('captionLabel', 'Off');
        }
    }

    setVideoSubtitleTrack(trackIndex, tracks) {
        this.set('captionsIndex', trackIndex);
        /*
         * Tracks could have changed even if the index hasn't.
         * Need to ensure track has data for captionsrenderer.
         */
        if (trackIndex && tracks && trackIndex <= tracks.length && tracks[trackIndex - 1].data) {
            this.set('captionsTrack', tracks[trackIndex - 1]);
        }
    }

    persistVideoSubtitleTrack(trackIndex, tracks) {
        this.setVideoSubtitleTrack(trackIndex, tracks);
        this.persistCaptionsTrack();
    }

    autoStartOnMobile() {
        return this.get('autostart') && platformCanAutostart(this);
    }

    // Mobile players always wait to become viewable.
    // Desktop players must have autostart set to viewable
    setAutoStart(autoStart) {
        if (autoStart !== undefined) {
            this.set('autostart', autoStart);
        }

        const autoStartOnMobile = this.autoStartOnMobile();
        const isAndroidSdk = this.get('sdkplatform') === 1;
        if (autoStartOnMobile && !isAndroidSdk) {
            this.set('autostartMuted', true);
        }
        this.set('playOnViewable', autoStartOnMobile || this.get('autostart') === 'viewable');
    }

    resetItem (item) {
        const position = item ? seconds(item.starttime) : 0;
        const duration = item ? seconds(item.duration) : 0;
        const mediaModel = this.mediaModel;
        this.playRejected = false;
        this.itemMeta = {};
        mediaModel.set('position', position);
        mediaModel.set('duration', duration);
    }
}

function _autoStartSupportedIOS() {
    if (!OS.iOS) {
        return false;
    }
    // Autostart only supported in iOS 10 or higher - check if the version is 9 or less
    return OS.version.major >= 10;
}

function platformCanAutostart(model) {
    var autostartAdsIsEnabled = (!model.get('advertising') || model.get('advertising').autoplayadsmuted);
    var iosBrowserIsSupported = _autoStartSupportedIOS() && (Browser.safari || Browser.chrome || Browser.facebook);
    var androidBrowserIsSupported = OS.android && Browser.chrome;
    var mobileBrowserIsSupported = (iosBrowserIsSupported || androidBrowserIsSupported);
    var isAndroidSdk = model.get('sdkplatform') === 1;
    return (!model.get('sdkplatform') && autostartAdsIsEnabled && mobileBrowserIsSupported) || isAndroidSdk;
}

const syncProviderProperties = (model, provider) => {
    model.set('provider', provider.getName());

    provider.volume(model.get('volume'));
    // Mute the video if autostarting on mobile, except for Android SDK. Otherwise, honor the model's mute value
    const isAndroidSdk = model.get('sdkplatform') === 1;
    provider.mute((model.autoStartOnMobile() && !isAndroidSdk) || model.get('mute'));
    if (model.get('instreamMode') === true) {
        provider.instreamMode = true;
    }

    if (provider.getName().name.indexOf('flash') === -1) {
        model.set('flashThrottle', undefined);
        model.flashBlocked = false;
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
class MediaModel extends SimpleModel {
    constructor() {
        super();
        this.addAttributes({
            mediaState: STATE_IDLE
        });
    }

    srcReset() {
        Object.assign(this.attributes, INITIAL_MEDIA_STATE, INITIAL_SOURCE_STATE);
    }
}

export { MediaModel };
export default Model;
