import { STATE_PAUSED, STATE_PLAYING, ERROR, FULLSCREEN,
    PLAYER_STATE, MEDIA_COMPLETE } from 'events/events';
import { OS } from 'environment/environment';
import Events from 'utils/backbone.events';
import changeStateEvent from 'events/change-state-event';
import Model from 'controller/model';

const InstreamHtml5 = function(_controller, _model) {
    var _adModel;
    var _currentProvider;
    var _this = Object.assign(this, Events);

    // Listen for player resize events
    _controller.on(FULLSCREEN, function(data) {
        this.trigger(FULLSCREEN, data);
    }, _this);

    /** ***************************************
     *****  Public instream API methods  *****
     *****************************************/

    this.init = function(mediaElement) {
        // Initialize the instream player's model copied from main player's model
        const playerAttributes = _model.attributes;
        const mediaModelContext = _model.mediaModel;
        _adModel = new Model().setup({
            id: playerAttributes.id,
            volume: playerAttributes.volume,
            fullscreen: playerAttributes.fullscreen,
            instreamMode: true,
            edition: playerAttributes.edition,
            mediaContext: mediaModelContext,
            mediaElement: mediaElement,
            mediaSrc: mediaElement.src,
            mute: playerAttributes.mute || playerAttributes.autostartMuted,
            autostartMuted: playerAttributes.autostartMuted,
            autostart: playerAttributes.autostart,
            advertising: playerAttributes.advertising,
            sdkplatform: playerAttributes.sdkplatform,
            skipButton: false
        });
        if (!OS.mobile) {
            _adModel.set('mediaContainer', _model.get('mediaContainer'));
        }
        _adModel.on('fullscreenchange', _nativeFullscreenHandler);
        _adModel.on('change:state', changeStateEvent, _this);
        _adModel.on(ERROR, function(data) {
            _this.trigger(ERROR, data);
        }, _this);
        // Listen to media element for events that indicate src was reset or load() was called
        _this.srcReset = function() {
            mediaModelContext.srcReset();
        };
        mediaElement.addEventListener('abort', _this.srcReset);
        mediaElement.addEventListener('emptied', _this.srcReset);
        this._adModel = _adModel;
    };

    /** Load an instream item and initialize playback **/
    _this.load = function() {
        // Let the player media model know we're using it's video tag
        _this.srcReset();

        // Make sure it chooses a provider
        _adModel.stopVideo();
        _adModel.setItemIndex(0).then(() => {
            if (!_adModel) {
                return;
            }
            _checkProvider(_adModel.getVideo());
        });
        _checkProvider();

        // Load the instream item
        return _adModel.playVideo();
    };

    _this.applyProviderListeners = function(provider) {
        // check provider after item change
        _checkProvider(provider);

        if (!provider) {
            return;
        }

        // Match the main player's controls state
        provider.off(ERROR);
        provider.on(ERROR, function(data) {
            this.trigger(ERROR, data);
        }, _this);
        _model.on('change:volume', function(data, value) {
            provider.volume(value);
        }, _this);
        _model.on('change:mute', function(data, value) {
            provider.mute(value);
        }, _this);
        _model.on('change:autostartMuted', function(data, value) {
            if (!value) {
                provider.mute(_model.get('mute'));
            }
        }, _this);
    };

    /** Stop the instream playback and revert the main player back to its original state **/
    this.instreamDestroy = function() {
        if (!_adModel) {
            return;
        }

        _adModel.off();
        if (_adModel.mediaModel) {
            _adModel.mediaModel.off();
        }

        // We don't want the instream provider to be attached to the video tag anymore
        this.off();
        if (_currentProvider) {
            _currentProvider.detachMedia();
            _currentProvider.off();
            if (_adModel.getVideo()) {
                _currentProvider.destroy();
            }
        }

        const mediaElement = _adModel.get('mediaElement');
        mediaElement.removeEventListener('abort', _this.srcReset);
        mediaElement.removeEventListener('emptied', _this.srcReset);

        // Reset the player media model if the src was changed externally
        const srcChanged = mediaElement.src !== _adModel.get('mediaSrc');
        if (srcChanged) {
            _model.mediaModel.srcReset();
        }

        // Return the view to its normal state
        _adModel = null;

        // Remove all callbacks for 'this' for all events
        _controller.off(null, null, this);
        _controller = null;
    };

    /** Start instream playback **/
    _this.instreamPlay = function() {
        if (!_adModel.getVideo()) {
            return;
        }
        _adModel.getVideo().play();
    };

    /** Pause instream playback **/
    _this.instreamPause = function() {
        if (!_adModel.getVideo()) {
            return;
        }
        _adModel.getVideo().pause();
    };


    /** ***************************
     ****** Private methods ******
     *****************************/

    function _checkProvider(pseudoProvider) {
        const provider = pseudoProvider || _adModel.getVideo();

        // Clear current provider when applyProviderListeners(null) is called
        _currentProvider = provider;

        if (!provider) {
            return;
        }

        var isVpaidProvider = provider.type === 'vpaid';

        provider.off();
        provider.on('all', function(type, data) {
            if (isVpaidProvider && (type === MEDIA_COMPLETE)) {
                return;
            }
            this.trigger(type, Object.assign({}, data, { type: type }));
        }, _this);

        const adMediaModelContext = _adModel.mediaModel;
        provider.on(PLAYER_STATE, (event) => {
            adMediaModelContext.set(PLAYER_STATE, event.newstate);
        });
        adMediaModelContext.on('change:' + PLAYER_STATE, (changeAdModel, state) => {
            stateHandler(state);
        });
        provider.attachMedia();
        provider.volume(_model.get('volume'));
        provider.mute(_model.get('mute') || _model.get('autostartMuted'));
        if (provider.setPlaybackRate) {
            provider.setPlaybackRate(1);
        }
    }

    function stateHandler(state) {
        switch (state) {
            case STATE_PLAYING:
            case STATE_PAUSED:
                _adModel.set(PLAYER_STATE, state);
                break;
            default:
                break;
        }
    }


    function _nativeFullscreenHandler(evt) {
        _model.trigger(evt.type, evt);
        _this.trigger(FULLSCREEN, {
            fullscreen: evt.jwstate
        });
    }

    return _this;
};

export default InstreamHtml5;
