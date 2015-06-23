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
        _controller.on(events.JWPLAYER_FULLSCREEN, _fullscreenHandler);

        /*****************************************
         *****  Public instream API methods  *****
         *****************************************/

        this.init = function() {
            // Initialize the instream player's model copied from main player's model
            _adModel = new Model().setup({
                id: _model.id,
                volume: _model.volume,
                fullscreen: _model.fullscreen,
                mute: _model.mute
            });
            _adModel.on('fullscreenchange', _nativeFullscreenHandler);

            this._adModel = _adModel;
        };

        /** Load an instream item and initialize playback **/
        _this.load = function(item) {
            // Make sure it chooses a provider
            _adModel.setPlaylist([item]);

            // check provider after item change
            _checkProvider();

            // Match the main player's controls state
            _adModel.off(events.JWPLAYER_ERROR);
            _adModel.on(events.JWPLAYER_ERROR, _forward);

            // Load the instream item
            _adModel.loadVideo();
        };

        /** Stop the instream playback and revert the main player back to its original state **/
        this.instreamDestroy = function() {
            if (!_adModel) {
                return;
            }

            _adModel.off();

            // We don't want the instream provider to be attached to the video tag anymore
            _this.off();
            if (_currentProvider) {
                _currentProvider.detachMedia();
                _currentProvider.resetEventListeners();
                _currentProvider.destroy();
            }

            // Return the view to its normal state
            _adModel = null;
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

        function _checkProvider() {
            var provider = _adModel.getVideo();

            if (_currentProvider !== provider) {
                _currentProvider = provider;

                if (!provider) {
                    return;
                }

                provider.resetEventListeners();

                provider.addGlobalListener(_forward);
                provider.addEventListener(events.JWPLAYER_MEDIA_BUFFER_FULL, _bufferFullHandler);

                provider.addEventListener(events.JWPLAYER_PLAYER_STATE, stateHandler);
                provider.attachMedia();
                provider.mute(_model.mute);
                provider.volume(_model.volume);

                _adModel.on('change:state', changeStateEvent, _this);
            }
        }

        function stateHandler(evt) {
            switch (evt.newstate) {
                case states.PLAYING:
                    _adModel.set('state', evt.newstate);
                    break;
                case states.PAUSED:
                    _adModel.set('state', evt.newstate);
                    break;
            }
        }

        /** Forward provider events to listeners **/
        function _forward(evt) {
            _this.trigger(evt.type, evt);
        }

        function _nativeFullscreenHandler(evt) {
            _model.trigger(evt.type, evt);
            _this.trigger(events.JWPLAYER_FULLSCREEN, {
                fullscreen: evt.jwstate
            });
        }

        function _fullscreenHandler(evt) {
            // required for updating the controlbars toggle icon
            _forward(evt);
        }

        /** Handle the JWPLAYER_MEDIA_BUFFER_FULL event **/
        function _bufferFullHandler() {
            _adModel.getVideo().play();
        }

        return _this;
    };

    return InstreamHtml5;
});
