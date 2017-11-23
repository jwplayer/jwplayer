import { Browser, OS } from 'environment/environment';
import SimpleModel from 'model/simplemodel';
import { INITIAL_PLAYER_STATE } from 'model/player-model';
import initQoe from 'controller/qoe';
import { PLAYER_STATE, STATE_IDLE, STATE_COMPLETE, MEDIA_VOLUME, MEDIA_MUTE,
    MEDIA_TYPE, PROVIDER_CHANGED, AUDIO_TRACKS, AUDIO_TRACK_CHANGED,
    MEDIA_RATE_CHANGE, MEDIA_BUFFER, MEDIA_TIME, MEDIA_LEVELS, MEDIA_LEVEL_CHANGED, MEDIA_ERROR,
    MEDIA_BEFORECOMPLETE, MEDIA_COMPLETE, MEDIA_META } from 'events/events';
import _ from 'utils/underscore';
import Events from 'utils/backbone.events';
import cancelable from 'utils/cancelable';
import ProviderController from 'providers/provider-controller';
import { seconds } from 'utils/strings';

// Represents the state of the player
const Model = function() {
    const _this = this;
    let providerController;
    let _provider;
    let _beforecompleted = false;
    let thenPlayPromise = cancelable(function() {});

    this.mediaController = Object.assign({}, Events);
    this.mediaModel = new MediaModel();

    initQoe(this);

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
        delete config.instream;
        delete config.mediaModel;
        return config;
    };

    this.videoEventHandler = function(type, data) {
        const event = Object.assign({}, data, {
            type: type
        });
        const mediaModel = this.mediaModel;
        switch (type) {
            case 'flashThrottle': {
                const throttled = (data.state !== 'resume');
                this.set('flashThrottle', throttled);
                this.set('flashBlocked', throttled);
            }
                break;
            case 'flashBlocked':
                this.set('flashBlocked', true);
                return;
            case 'flashUnblocked':
                this.set('flashBlocked', false);
                return;
            case MEDIA_VOLUME:
                this.set(type, data[type]);
                return;
            case MEDIA_MUTE:
                if (!this.get('autostartMuted')) {
                    // Don't persist mute state with muted autostart
                    this.set(type, data[type]);
                }
                return;
            case MEDIA_RATE_CHANGE: {
                const rate = data.playbackRate;
                // Check if its a generally usable rate.  Shaka changes rate to 0 when pause or buffering.
                if (rate > 0) {
                    this.set('playbackRate', rate);
                }
            }
                return;
            case MEDIA_TYPE:
                if (mediaModel.get('mediaType') !== data.mediaType) {
                    mediaModel.set('mediaType', data.mediaType);
                    this.mediaController.trigger(type, event);
                }
                return;
            case PLAYER_STATE: {
                if (data.newstate === STATE_IDLE) {
                    thenPlayPromise.cancel();
                    mediaModel.srcReset();
                }
                // Always fire change:state to keep player model in sync
                const previousState = mediaModel.attributes[PLAYER_STATE];
                mediaModel.attributes[PLAYER_STATE] = data.newstate;
                mediaModel.trigger('change:' + PLAYER_STATE, mediaModel, data.newstate, previousState);
            }
                // This "return" is important because
                //  we are choosing to not propagate this event.
                //  Instead letting the master controller do so
                return;
            case MEDIA_ERROR:
                thenPlayPromise.cancel();
                mediaModel.srcReset();
                break;
            case MEDIA_BUFFER:
                this.set('buffer', data.bufferPercent);
            /* falls through */
            case MEDIA_META: {
                const duration = data.duration;
                if (_.isNumber(duration) && !_.isNaN(duration)) {
                    mediaModel.set('duration', duration);
                    this.set('duration', duration);
                }
                Object.assign(this.get('itemMeta'), data.metadata);
                break;
            }
            case MEDIA_TIME: {
                mediaModel.set('position', data.position);
                this.set('position', data.position);
                const duration = data.duration;
                if (_.isNumber(duration) && !_.isNaN(duration)) {
                    mediaModel.set('duration', duration);
                    this.set('duration', duration);
                }
                break;
            }
            case PROVIDER_CHANGED:
                this.set('provider', _provider.getName());
                break;
            case MEDIA_LEVELS:
                this.setQualityLevel(data.currentQuality, data.levels);
                mediaModel.set('levels', data.levels);
                break;
            case MEDIA_LEVEL_CHANGED:
                this.setQualityLevel(data.currentQuality, data.levels);
                this.persistQualityLevel(data.currentQuality, data.levels);
                break;
            case MEDIA_COMPLETE:
                _beforecompleted = true;
                this.mediaController.trigger(MEDIA_BEFORECOMPLETE, event);
                if (this.get('attached')) {
                    this.playbackComplete();
                }
                return;
            case AUDIO_TRACKS:
                this.setCurrentAudioTrack(data.currentTrack, data.tracks);
                mediaModel.set('audioTracks', data.tracks);
                break;
            case AUDIO_TRACK_CHANGED:
                this.setCurrentAudioTrack(data.currentTrack, data.tracks);
                break;
            case 'subtitlesTrackChanged':
                this.persistVideoSubtitleTrack(data.currentTrack, data.tracks);
                break;
            case 'visualQuality':
                mediaModel.set('visualQuality', Object.assign({}, data));
                break;
            default:
                break;
        }

        // TODO: Events are forwarded off the model so that we can remove mediaController instances from the view
        this.trigger(type, event);

        this.mediaController.trigger(type, event);
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

    this.setActiveItem = function (item, index) {
        this.resetItem(item);
        this.attributes.playlistItem = null;
        this.set('item', index);
        this.set('minDvrWindow', item.minDvrWindow);
        this.set('playlistItem', item);
        this.trigger('itemReady', item);
    };

    this.setMediaModel = function (mediaModel) {
        if (this.mediaModel) {
            this.mediaModel.off();
        }

        this.mediaModel = mediaModel;
        this.set('mediaModel', mediaModel);
        syncPlayerWithMediaModel(mediaModel);
    };

    this.setCurrentAudioTrack = function(currentTrack, tracks) {
        if (currentTrack > -1 && tracks.length > 0 && currentTrack < tracks.length) {
            this.mediaModel.set('currentAudioTrack', parseInt(currentTrack));
        }
    };

    this.onMediaContainer = function() {
        var container = this.get('mediaContainer');
        _provider.setContainer(container);
    };

    this.checkComplete = function() {
        return _beforecompleted;
    };

    this.playbackComplete = function() {
        _beforecompleted = false;
        _provider.setState(STATE_COMPLETE);
        this.mediaController.trigger(MEDIA_COMPLETE, {});
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
        if (_provider) {
            _provider.volume(volume);
        }
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
        if (_provider) {
            _provider.mute(mute);
        }
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
        if (!this.get('attached') || !_.isNumber(playbackRate)) {
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
        this.set('playRejected', false);
        this.set('itemMeta', {});
        this.set('position', position);
        this.set('duration', duration);
    };

    this.setThenPlayPromise = function (promise) {
        thenPlayPromise.cancel();
        thenPlayPromise = promise;
    };
};

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
        model.set('flashBlocked', false);
    }
    // Set playbackRate because provider support for playbackRate may have changed and not sent an update
    model.set('supportsPlaybackRate', !!provider.supportsPlaybackRate);
    model.set('playbackRate', provider.getPlaybackRate());
    model.set('renderCaptionsNatively', provider.renderNatively);
};

function syncPlayerWithMediaModel(mediaModel) {
    // Sync player state with mediaModel state
    const mediaState = mediaModel.get('state');
    mediaModel.trigger('change:state', mediaModel, mediaState, mediaState);
}

// Represents the state of the provider/media element
const MediaModel = Model.MediaModel = function() {
    this.attributes = {
        state: STATE_IDLE
    };
};

Object.assign(MediaModel.prototype, SimpleModel, {
    srcReset() {
        const attributes = this.attributes;
        attributes.setup = false;
        attributes.started = false;
        attributes.preloaded = false;
        attributes.visualQuality = null;
    }
});

Object.assign(Model.prototype, SimpleModel);

export { MediaModel };
export default Model;
