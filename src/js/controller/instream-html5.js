import { STATE_PAUSED, STATE_PLAYING, ERROR, FULLSCREEN,
    MEDIA_BUFFER_FULL, PLAYER_STATE, MEDIA_COMPLETE } from 'events/events';
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

    this.init = function() {
        // Initialize the instream player's model copied from main player's model
        _adModel = new Model().setup({
            id: _model.get('id'),
            volume: _model.get('volume'),
            fullscreen: _model.get('fullscreen'),
            mute: _model.get('mute') || _model.get('autostartMuted'),
            instreamMode: true,
            edition: _model.get('edition'),
        });
        if (!OS.mobile) {
            _adModel.set('mediaContainer', _model.get('mediaContainer'));
        }
        _adModel.on('fullscreenchange', _nativeFullscreenHandler);

        this._adModel = _adModel;
    };

    /** Load an instream item and initialize playback **/
    _this.load = function(item) {

        _adModel.set('item', 0);
        _adModel.set('playlistItem', item);
        // Make sure it chooses a provider
        _adModel.setActiveItem(item);

        // check provider after item change
        _checkProvider();

        // Match the main player's controls state
        _adModel.off(ERROR);
        _adModel.on(ERROR, function(data) {
            this.trigger(ERROR, data);
        }, _this);

        // Load the instream item
        return _adModel.loadVideo(item);
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
            _currentProvider.volume(value);
        }, _this);
        _model.on('change:mute', function(data, value) {
            _currentProvider.mute(value);
        }, _this);
        _model.on('change:autostartMuted', function(data, value) {
            if (!value) {
                _currentProvider.mute(_model.get('mute'));
            }
        }, _this);
    };

    /** Stop the instream playback and revert the main player back to its original state **/
    this.instreamDestroy = function() {
        if (!_adModel) {
            return;
        }

        _adModel.off();

        // We don't want the instream provider to be attached to the video tag anymore
        this.off();
        if (_currentProvider) {
            _currentProvider.detachMedia();
            _currentProvider.off();
            if (_adModel.getVideo()) {
                _currentProvider.destroy();
            }
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
        _adModel.getVideo().play(true);
    };

    /** Pause instream playback **/
    _this.instreamPause = function() {
        if (!_adModel.getVideo()) {
            return;
        }
        _adModel.getVideo().pause(true);
    };


    /** ***************************
     ****** Private methods ******
     *****************************/

    function _checkProvider(pseudoProvider) {
        var provider = pseudoProvider || _adModel.getVideo();

        if (_currentProvider !== provider) {
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

            provider.on(MEDIA_BUFFER_FULL, _bufferFullHandler);

            provider.on(PLAYER_STATE, stateHandler);
            provider.attachMedia();
            provider.volume(_model.get('volume'));
            provider.mute(_model.get('mute') || _model.get('autostartMuted'));

            _adModel.on('change:state', changeStateEvent, _this);
        }
    }

    function stateHandler(evt) {
        switch (evt.newstate) {
            case STATE_PLAYING:
            case STATE_PAUSED:
                _adModel.set('state', evt.newstate);
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

    /** Handle the MEDIA_BUFFER_FULL event **/
    function _bufferFullHandler() {
        _adModel.getVideo().play();
    }

    return _this;
};

export default InstreamHtml5;
