import { OS } from 'environment/environment';
import SimpleModel from 'model/simplemodel';
import { INITIAL_PLAYER_STATE, INITIAL_MEDIA_STATE } from 'model/player-model';
import { STATE_IDLE } from 'events/events';
import { isValidNumber, isNumber } from 'utils/underscore';
import { seconds } from 'utils/strings';
import Providers from 'providers/providers';

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
        config = config || {};
        this._normalizeConfig(config);
        Object.assign(this.attributes, config, INITIAL_PLAYER_STATE);
        this.providerController = new Providers(this.getConfiguration());
        this.setAutoStart();
        return this;
    }

    getConfiguration() {
        const config = this.clone();
        const mediaModelAttributes = config.mediaModel.attributes;
        Object.keys(INITIAL_MEDIA_STATE).forEach(key => {
            config[key] = mediaModelAttributes[key];
        });
        config.instreamMode = !!config.instream;
        delete config.instream;
        delete config.mediaModel;
        return config;
    }

    persistQualityLevel(quality, levels) {
        const currentLevel = levels[quality] || {};
        const { label } = currentLevel;
        // Default to null if bitrate is bad, or when the quality to persist is "auto" (bitrate is undefined in this case)
        const bitrate = isValidNumber(currentLevel.bitrate) ? currentLevel.bitrate : null;
        this.set('bitrateSelection', bitrate);
        this.set('qualityLabel', label);
    }

    setActiveItem(index) {
        const item = this.get('playlist')[index];
        this.resetItem(item);
        this.attributes.playlistItem = null;
        this.set('item', index);
        this.set('minDvrWindow', item.minDvrWindow);
        this.set('dvrSeekLimit', item.dvrSeekLimit);
        this.set('playlistItem', item);
    }

    setMediaModel(mediaModel) {
        if (this.mediaModel && this.mediaModel !== mediaModel) {
            this.mediaModel.off();
        }

        mediaModel = mediaModel || new MediaModel();
        this.set('mediaModel', mediaModel);
        syncPlayerWithMediaModel(mediaModel);
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
        state = !!state;
        if (state !== this.get('fullscreen')) {
            this.set('fullscreen', state);
        }
    }

    getProviders() {
        return this.providerController;
    }

    setVolume(volume) {
        if (!isValidNumber(volume)) {
            return;
        }
        const vol = Math.min(Math.max(0, volume), 100);
        this.set('volume', vol);
        const mute = (vol === 0);
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
        this.set('mute', !!mute);
        if (!mute) {
            const volume = Math.max(10, this.get('volume'));
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

    setProvider(provider) {
        this._provider = provider;
        syncProviderProperties(this, provider);
    }

    resetProvider() {
        this._provider = null;
        this.set('provider', undefined);
    }

    setPlaybackRate(playbackRate) {
        if (!isNumber(playbackRate)) {
            return;
        }

        // Clamp the rate between 0.25x and 4x
        playbackRate = Math.max(Math.min(playbackRate, 4), 0.25);


        this.set('defaultPlaybackRate', playbackRate);

        if (this._provider && this._provider.setPlaybackRate) {
            this._provider.setPlaybackRate(playbackRate);
        }
    }

    persistCaptionsTrack() {
        const track = this.get('captionsTrack');

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

    // Mobile players always wait to become viewable.
    // Desktop players must have autostart set to viewable
    setAutoStart(autoStart) {
        if (autoStart !== undefined) {
            this.set('autostart', autoStart);
        }

        const autoStartOnMobile = OS.mobile && this.get('autostart');
        this.set('playOnViewable', autoStartOnMobile || this.get('autostart') === 'viewable');
    }

    resetItem(item) {
        const position = item ? seconds(item.starttime) : 0;
        const duration = item ? seconds(item.duration) : 0;
        const mediaModel = this.mediaModel;
        this.set('playRejected', false);
        this.attributes.itemMeta = {};
        mediaModel.set('position', position);
        mediaModel.set('currentTime', 0);
        mediaModel.set('duration', duration);
    }

    persistBandwidthEstimate(bwEstimate) {
        if (!isValidNumber(bwEstimate)) {
            return;
        }
        this.set('bandwidthEstimate', bwEstimate);
    }

    _normalizeConfig(cfg) {
        const floating = cfg.floating;

        if (floating && !!floating.disabled) {
            delete cfg.floating;
        }
    }
}

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
class MediaModel extends SimpleModel {

    constructor() {
        super();
        this.addAttributes({
            mediaState: STATE_IDLE
        });
    }

    srcReset() {
        Object.assign(this.attributes, {
            setup: false,
            started: false,
            preloaded: false,
            visualQuality: null,
            buffer: 0,
            currentTime: 0
        });
    }
}

export { MediaModel };
export default Model;
