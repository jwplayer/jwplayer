define([
    'utils/underscore',
    'utils/backbone.events',
    'events/change-state-event',
    'events/events',
    'events/states',
    'controller/model'
], function(_, Events, changeStateEvent, events, states, Model) {

    var InstreamHtml5 = function(_controller, _model) {

        var _adModel,
            _currentProvider,
            _this = _.extend(this, Events);

        // Listen for player resize events
        _controller.on(events.JWPLAYER_FULLSCREEN, function(data) {
            this.trigger(events.JWPLAYER_FULLSCREEN, data);
        }, _this);

        /*****************************************
         *****  Public instream API methods  *****
         *****************************************/

        this.init = function() {
            // Initialize the instream player's model copied from main player's model
            _adModel = new Model().setup({
                id: _model.get('id'),
                volume: _model.get('volume'),
                fullscreen: _model.get('fullscreen'),
                mute: _model.get('mute') || _model.get('autostartMuted'),
                instreamMode: true
            });
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
            _adModel.off(events.JWPLAYER_ERROR);
            _adModel.on(events.JWPLAYER_ERROR, function(data) {
                this.trigger(events.JWPLAYER_ERROR, data);
            }, _this);

            // Load the instream item
            _adModel.loadVideo(item);
        };

        _this.applyProviderListeners = function(provider){
            // check provider after item change
            _checkProvider(provider);

            // Match the main player's controls state
            provider.off(events.JWPLAYER_ERROR);
            provider.on(events.JWPLAYER_ERROR, function(data) {
                this.trigger(events.JWPLAYER_ERROR, data);
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
                if(_adModel.getVideo()){
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


        /*****************************
         ****** Private methods ******
         *****************************/

        function _checkProvider(pseduoProvider) {
            var provider = pseduoProvider || _adModel.getVideo();

            if (_currentProvider !== provider) {
                _currentProvider = provider;

                if (!provider) {
                    return;
                }

                var isVpaidProvider = provider.type === 'vpaid';

                provider.off();

                provider.on('all', function(type, data) {
                    if (isVpaidProvider && (type === events.JWPLAYER_MEDIA_COMPLETE)) {
                        return;
                    }
                    this.trigger(type, _.extend({}, data, {type: type}));
                }, _this);

                provider.on(events.JWPLAYER_MEDIA_BUFFER_FULL, _bufferFullHandler);

                provider.on(events.JWPLAYER_PLAYER_STATE, stateHandler);
                provider.attachMedia();
                provider.volume(_model.get('volume'));
                provider.mute(_model.get('mute') || _model.get('autostartMuted'));

                _adModel.on('change:state', changeStateEvent, _this);
            }
        }

        function stateHandler(evt) {
            switch (evt.newstate) {
                case states.PLAYING:
                case states.PAUSED:
                    _adModel.set('state', evt.newstate);
                    break;
            }
        }


        function _nativeFullscreenHandler(evt) {
            _model.trigger(evt.type, evt);
            _this.trigger(events.JWPLAYER_FULLSCREEN, {
                fullscreen: evt.jwstate
            });
        }

        /** Handle the JWPLAYER_MEDIA_BUFFER_FULL event **/
        function _bufferFullHandler() {
            _adModel.getVideo().play();
        }

        return _this;
    };

    return InstreamHtml5;
});
