import { Browser, OS } from 'environment/environment';
import SimpleModel from 'model/simplemodel';
import { INITIAL_PLAYER_STATE } from 'model/player-model';
import Providers from 'providers/providers';
import { loadProvidersForPlaylist } from 'api/set-playlist';
import getMediaElement from 'api/get-media-element';
import initQoe from 'controller/qoe';
import { PLAYER_STATE, STATE_IDLE, STATE_BUFFERING, STATE_PAUSED, STATE_COMPLETE, MEDIA_VOLUME, MEDIA_MUTE,
    MEDIA_TYPE, PROVIDER_CHANGED, AUDIO_TRACKS, AUDIO_TRACK_CHANGED,
    MEDIA_PLAY_ATTEMPT, MEDIA_PLAY_ATTEMPT_FAILED, MEDIA_RATE_CHANGE,
    MEDIA_BUFFER, MEDIA_TIME, MEDIA_LEVELS, MEDIA_LEVEL_CHANGED, MEDIA_ERROR, ERROR,
    MEDIA_BEFORECOMPLETE, MEDIA_COMPLETE, MEDIA_META } from 'events/events';
import { seconds } from 'utils/strings';
import _ from 'utils/underscore';
import Events from 'utils/backbone.events';
import { resolved } from 'polyfills/promise';
import cancelable from 'utils/cancelable';

// Represents the state of the player
const Model = function() {
    const _this = this;
    let _providers;
    let _provider;
    let _beforecompleted = false;
    let _attached = true;
    let thenPlayPromise = cancelable(function() {});
    let providerPromise = resolved;

    this.mediaController = Object.assign({}, Events);
    this.mediaModel = new MediaModel();

    initQoe(this);

    this.set('mediaModel', this.mediaModel);

    this.setup = function(config) {

        Object.assign(this.attributes, config, INITIAL_PLAYER_STATE);

        this.updateProviders();
        this.setAutoStart();

        return this;
    };

    this.getConfiguration = function() {
        const config = this.clone();
        delete config.mediaModel;
        return config;
    };

    this.updateProviders = function() {
        _providers = new Providers(this.getConfiguration());
    };

    function _videoEventHandler(type, data) {
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
                if (_attached) {
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

        this.mediaController.trigger(type, event);
    }

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

    this.setCurrentAudioTrack = function(currentTrack, tracks) {
        if (currentTrack > -1 && tracks.length > 0 && currentTrack < tracks.length) {
            this.mediaModel.set('currentAudioTrack', parseInt(currentTrack));
        }
    };

    this.onMediaContainer = function() {
        var container = this.get('mediaContainer');
        _provider.setContainer(container);
    };

    this.changeVideoProvider = function(Provider) {
        this.off('change:mediaContainer', this.onMediaContainer);

        if (_provider) {
            _provider.off(null, null, this);
            if (_provider.getContainer()) {
                _provider.remove();
            }
            delete _provider.instreamMode;
        }

        if (!Provider) {
            this.resetProvider();
            this.set('provider', undefined);
            return;
        }

        _provider = new Provider(_this.get('id'), _this.getConfiguration());

        var container = this.get('mediaContainer');
        if (container) {
            _provider.setContainer(container);
        } else {
            this.once('change:mediaContainer', this.onMediaContainer);
        }

        if (_provider.getName().name.indexOf('flash') === -1) {
            this.set('flashThrottle', undefined);
            this.set('flashBlocked', false);
        }

        _provider.volume(_this.get('volume'));

        // Mute the video if autostarting on mobile, except for Android SDK. Otherwise, honor the model's mute value
        const isAndroidSdk = _this.get('sdkplatform') === 1;
        _provider.mute((this.autoStartOnMobile() && !isAndroidSdk) || _this.get('mute'));

        _provider.on('all', _videoEventHandler, this);

        // Attempt setting the playback rate to be the user selected value
        this.setPlaybackRate(this.get('defaultPlaybackRate'));

        // Set playbackRate because provider support for playbackRate may have changed and not sent an update
        this.set('playbackRate', _provider.getPlaybackRate());

        if (this.get('instreamMode') === true) {
            _provider.instreamMode = true;
        }

        this.set('renderCaptionsNatively', _provider.renderNatively);
    };

    this.checkComplete = function() {
        return _beforecompleted;
    };

    this.detachMedia = function() {
        thenPlayPromise.cancel();
        _attached = false;
        if (_provider) {
            _provider.off('all', _videoEventHandler, this);
            _provider.detachMedia();
        }
    };

    this.attachMedia = function() {
        _attached = true;
        if (_provider) {
            _provider.off('all', _videoEventHandler, this);
            _provider.on('all', _videoEventHandler, this);
        }
        if (_beforecompleted) {
            this.playbackComplete();
        }
        if (_provider) {
            _provider.attachMedia();
        }

        // Restore the playback rate to the provider in case it changed while detached and we reused a video tag.
        this.setPlaybackRate(this.get('defaultPlaybackRate'));
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

    // Give the option for a provider to be forced
    this.chooseProvider = function(source) {
        // if _providers.choose is null, something went wrong in filtering
        return _providers.choose(source).provider;
    };

    this.setItemIndex = function(index) {
        const playlist = this.get('playlist');
        const length = playlist.length;

        // If looping past the end, or before the beginning
        index = parseInt(index, 10) || 0;
        index = (index + length) % length;

        this.set('item', index);
        return this.setActiveItem(playlist[index]);
    };

    this.setActiveItem = function(item) {
        thenPlayPromise.cancel();
        // Item is actually changing
        this.mediaModel.off();
        this.mediaModel = new MediaModel();
        resetItem(this, item);
        this.set('minDvrWindow', item.minDvrWindow);
        this.set('mediaModel', this.mediaModel);
        this.attributes.playlistItem = null;
        this.set('playlistItem', item);
        providerPromise = this.setProvider(item);
        return providerPromise;
    };

    function resetItem(model, item) {
        const position = item ? seconds(item.starttime) : 0;
        const duration = item ? seconds(item.duration) : 0;
        const mediaModelState = model.mediaModel.attributes;
        model.mediaModel.srcReset();
        mediaModelState.position = position;
        mediaModelState.duration = duration;

        model.set('playRejected', false);
        model.set('itemMeta', {});
        model.set('position', position);
        model.set('duration', duration);
    }

    this.setProvider = function(item) {
        const source = item && item.sources && item.sources[0];
        if (source === undefined) {
            // source is undefined when resetting index with empty playlist
            throw new Error('No media');
        }

        const Provider = this.chooseProvider(source);
        // If we are changing video providers
        if (!Provider || !(_provider && _provider instanceof Provider)) {
            // Replace the video tag for the next provider
            if (_provider) {
                replaceMediaElement(this);
            }
            this.changeVideoProvider(Provider);
        }

        if (!_provider) {
            this.set(PLAYER_STATE, STATE_BUFFERING);
            const mediaModelContext = this.mediaModel;
            return loadProvidersForPlaylist(this).then(() => {
                if (mediaModelContext === this.mediaModel) {
                    syncPlayerWithMediaModel(mediaModelContext);
                    // Verify that we have a provider class for this source
                    if (this.chooseProvider(source)) {
                        return this.setProvider(item);
                    }
                }
            });
        }

        // this allows the providers to preload
        if (_provider.init) {
            _provider.init(item);
        }

        // Set the Provider after calling init because some Provider properties are only set afterwards
        this.set('provider', _provider.getName());

        // Listening for change:item won't suffice when loading the same index or file
        // We also can't listen for change:mediaModel because it triggers whether or not
        //  an item was actually loaded
        this.trigger('itemReady', item);
        return resolved;
    };

    function replaceMediaElement(model) {
        // Replace click-to-play media element, and call .load() to unblock user-gesture to play requirement
        const lastMediaElement = model.attributes.mediaElement;
        const mediaElement =
            model.attributes.mediaElement = getMediaElement();
        mediaElement.volume = lastMediaElement.volume;
        mediaElement.muted = lastMediaElement.muted;
        mediaElement.load();
    }

    this.getProviders = function() {
        return _providers;
    };

    this.resetProvider = function() {
        _provider = null;
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

    this.setPlaybackRate = function(playbackRate) {
        if (!_attached || !_.isNumber(playbackRate)) {
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

    function loadAndPlay(model, item) {
        thenPlayPromise.cancel();

        const mediaModelContext = model.mediaModel;

        mediaModelContext.set('setup', true);
        if (_provider) {
            return playWithProvider(item);
        }

        thenPlayPromise = cancelable(() => {
            if (mediaModelContext === model.mediaModel) {
                return playWithProvider(item);
            }
            throw new Error('Playback cancelled.');
        });
        return providerPromise.catch(error => {
            thenPlayPromise.cancel();
            // Required provider was not loaded
            model.trigger(ERROR, {
                message: `Could not play video: ${error.message}`,
                error: error
            });
            // Fail the playPromise to trigger "playAttemptFailed"
            throw error;
        }).then(thenPlayPromise.async);
    }

    function playWithProvider(item) {
        // Calling load() on Shaka may return a player setup promise
        const providerSetupPromise = _provider.load(item);
        if (providerSetupPromise) {
            thenPlayPromise = cancelable(() => {
                return _provider.play() || resolved;
            });
            return providerSetupPromise.then(thenPlayPromise.async);
        }
        return _provider.play() || resolved;
    }

    function playAttempt(model, playPromise, playReason) {
        const mediaModelContext = model.mediaModel;
        const itemContext = model.get('playlistItem');

        model.mediaController.trigger(MEDIA_PLAY_ATTEMPT, {
            item: itemContext,
            playReason: playReason
        });

        // Immediately set player state to buffering if these conditions are met
        const videoTagUnpaused = _provider && _provider.video && !_provider.video.paused;
        if (videoTagUnpaused) {
            model.set(PLAYER_STATE, STATE_BUFFERING);
        }

        playPromise.then(() => {
            if (!mediaModelContext.get('setup')) {
                // Exit if model state was reset
                return;
            }
            mediaModelContext.set('started', true);
            if (mediaModelContext === model.mediaModel) {
                syncPlayerWithMediaModel(mediaModelContext);
            }
        }).catch(error => {
            model.set('playRejected', true);
            const videoTagPaused = _provider && _provider.video && _provider.video.paused;
            if (videoTagPaused) {
                mediaModelContext.set(PLAYER_STATE, STATE_PAUSED);
            }
            model.mediaController.trigger(MEDIA_PLAY_ATTEMPT_FAILED, {
                error: error,
                item: itemContext,
                playReason: playReason
            });
        });
    }

    function syncPlayerWithMediaModel(mediaModel) {
        // Sync player state with mediaModel state
        const mediaState = mediaModel.get('state');
        mediaModel.trigger('change:state', mediaModel, mediaState, mediaState);
    }

    this.stopVideo = function() {
        thenPlayPromise.cancel();
        const item = this.get('playlist')[this.get('item')];
        this.attributes.playlistItem = item;
        resetItem(this, item);
        if (_provider) {
            _provider.stop();
        }
    };

    this.preloadVideo = function() {
        const item = this.get('playlistItem');
        // Only attempt to preload if media is attached and hasn't been loaded
        if (this.get('state') === 'idle' && _attached && _provider &&
            item.preload !== 'none' &&
            this.get('autostart') === false &&
            !this.mediaModel.get('setup') &&
            !this.mediaModel.get('preloaded')) {
            this.mediaModel.set('preloaded', true);
            _provider.preload(item);
        }
    };

    this.playVideo = function(playReason) {
        const item = this.get('playlistItem');
        if (!item) {
            return;
        }

        if (!playReason) {
            playReason = this.get('playReason');
        }

        let playPromise;

        this.set('playRejected', false);
        if (!this.mediaModel.get('setup')) {
            playPromise = loadAndPlay(this, item);
            playAttempt(this, playPromise, playReason);
        } else {
            playPromise = _provider.play() || resolved;
            if (!this.mediaModel.get('started')) {
                playAttempt(this, playPromise, playReason);
            }
        }
        return playPromise;
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

        if (_provider && _provider.setSubtitlesTrack) {
            _provider.setSubtitlesTrack(trackIndex);
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
};

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

export default Model;
