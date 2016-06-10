define([
    'controller/instream-html5',
    'controller/instream-flash',
    'events/events',
    'events/states',
    'utils/helpers',
    'utils/backbone.events',
    'utils/underscore'
], function(InstreamHtml5, InstreamFlash, events, states, utils, Events, _) {

    function chooseInstreamMethod(_model) {
        var providerName = _model.get('provider').name || '';
        if (providerName.indexOf('flash') >= 0) {
            return InstreamFlash;
        }

        return InstreamHtml5;
    }

    var _defaultOptions = {
        skipoffset: null,
        tag: null
    };

    var InstreamAdapter = function(_controller, _model, _view) {

        var InstreamMethod = chooseInstreamMethod(_model);
        var _instream = new InstreamMethod(_controller, _model);

        var _array, // the copied in playlist
            _arrayOptions,
            _arrayIndex = 0,
            _options = {},
            _oldProvider,
            _oldpos,
            _olditem;

        var _clickHandler = _.bind(function(evt) {
            evt = evt || {};
            evt.hasControls = !!_model.get('controls');

            this.trigger(events.JWPLAYER_INSTREAM_CLICK, evt);

            // toggle playback after click event
            if (!_instream || !_instream._adModel) {
                return;
            }
            if (_instream._adModel.get('state') === states.PAUSED) {
                if (evt.hasControls) {
                    _instream.instreamPlay();
                }
            } else {
                _instream.instreamPause();
            }
        }, this);

        var _doubleClickHandler = _.bind(function() {
            if (!_instream || !_instream._adModel) {
                return;
            }
            if (_instream._adModel.get('state') === states.PAUSED) {
                if (_model.get('controls')) {
                    _controller.setFullscreen();
                    _controller.play();
                }
            }
        }, this);

        this.type = 'instream';

        this.init = function() {

            // Keep track of the original player state
            _oldProvider = _model.getVideo();
            _oldpos = _model.get('position');
            _olditem = _model.get('playlist')[_model.get('item')];

            _instream.on('all', _instreamForward, this);
            _instream.on(events.JWPLAYER_MEDIA_TIME, _instreamTime, this);
            _instream.on(events.JWPLAYER_MEDIA_COMPLETE, _instreamItemComplete, this);
            _instream.init();

            // Make sure the original player's provider stops broadcasting events (pseudo-lock...)
            _oldProvider.detachMedia();

            _model.mediaModel.set('state', states.BUFFERING);

            if (_controller.checkBeforePlay() || (_oldpos === 0 && !_oldProvider.checkComplete())) {
                // make sure video restarts after preroll
                _oldpos = 0;
                _model.set('preInstreamState', 'instream-preroll');
            } else if (_oldProvider && _oldProvider.checkComplete() || _model.get('state') === states.COMPLETE) {
                _model.set('preInstreamState', 'instream-postroll');
            } else {
                _model.set('preInstreamState', 'instream-midroll');
            }

            // If the player's currently playing, pause the video tag
            var currState = _model.get('state');
            if (currState === states.PLAYING || currState === states.BUFFERING) {
                _oldProvider.pause();
            }

            // Show instream state instead of normal player state
            _view.setupInstream(_instream._adModel);
            _instream._adModel.set('state', states.BUFFERING);

            // don't trigger api play/pause on display click
            _view.clickHandler().setAlternateClickHandlers(utils.noop, null);

            this.setText('Loading ad');
            return this;
        };

        function _instreamForward(type, data) {
            if (type === 'complete') {
                return;
            }
            data = data || {};

            if (_options.tag && !data.tag) {
                data.tag = _options.tag;
            }

            this.trigger(type, data);
        }

        function _instreamTime(evt) {
            _instream._adModel.set('duration', evt.duration);
            _instream._adModel.set('position', evt.position);
        }

        function _instreamItemComplete(e) {
            var data = {};
            if (_options.tag) {
                data.tag = _options.tag;
            }

            if (_array && _arrayIndex + 1 < _array.length) {
                // fire complete event
                this.trigger(events.JWPLAYER_MEDIA_COMPLETE, data);

                // We want a play event for the next item, so we ensure the state != playing
                _instream._adModel.set('state', 'buffering');

                // destroy skip button
                _model.set('skipButton', false);

                _arrayIndex++;
                var item = _array[_arrayIndex];
                var options;
                if (_arrayOptions) {
                    options = _arrayOptions[_arrayIndex];
                }
                this.loadItem(item, options);
            } else {
                if (e.type === events.JWPLAYER_MEDIA_COMPLETE) {
                    this.trigger(events.JWPLAYER_MEDIA_COMPLETE, data);
                    // Dispatch playlist complete event for ad pods
                    this.trigger(events.JWPLAYER_PLAYLIST_COMPLETE, {});
                }
                this.destroy();
            }
        }

        this.loadItem = function(item, options) {
            if (utils.isAndroid(2.3)) {
                this.trigger({
                    type: events.JWPLAYER_ERROR,
                    message: 'Error loading instream: Cannot play instream on Android 2.3'
                });
                return;
            }
            // Copy the playlist item passed in and make sure it's formatted as a proper playlist item
            if (_.isArray(item)) {
                _array = item;
                _arrayOptions = options;
                item = _array[_arrayIndex];
                if (_arrayOptions) {
                    options = _arrayOptions[_arrayIndex];
                }
            }

            // Dispatch playlist item event for ad pods
            this.trigger(events.JWPLAYER_PLAYLIST_ITEM, {
                index: _arrayIndex,
                item: item
            });

            _options = _.extend({}, _defaultOptions, options);
            _instream.load(item);

            this.addClickHandler();

            var skipoffset = item.skipoffset || _options.skipoffset;
            if (skipoffset) {
                _instream._adModel.set('skipMessage', _options.skipMessage);
                _instream._adModel.set('skipText', _options.skipText);
                _instream._adModel.set('skipOffset', skipoffset);

                _model.set('skipButton', true);
            }
        };

        this.applyProviderListeners = function(provider){
            _instream.applyProviderListeners(provider);

            this.addClickHandler();
        };

        this.play = function() {
            _instream.instreamPlay();
        };

        this.pause = function() {
            _instream.instreamPause();
        };

        this.hide = function() {
            _instream.hide();
        };

        this.addClickHandler = function() {
            // start listening for ad click
            _view.clickHandler().setAlternateClickHandlers(_clickHandler, _doubleClickHandler);

            //if (utils.isMSIE()) {
                //_oldProvider.parentElement.addEventListener('click', _view.clickHandler().clickHandler);
            //}

            _instream.on(events.JWPLAYER_MEDIA_META, this.metaHandler, this);

        };

        this.skipAd = function(evt) {
            var skipAdType = events.JWPLAYER_AD_SKIPPED;
            this.trigger(skipAdType, evt);
            _instreamItemComplete.call(this, {
                type: skipAdType
            });
        };

        /** Handle the JWPLAYER_MEDIA_META event **/
        this.metaHandler = function (evt) {
            // If we're getting video dimension metadata from the provider, allow the view to resize the media
            if (evt.width && evt.height) {
                _view.resizeMedia();
            }
        };

        this.destroy = function() {
            this.off();

            _model.set('skipButton', false);

            if (_instream) {
                if (_view.clickHandler()) {
                    _view.clickHandler().revertAlternateClickHandlers();
                }
                _instream.instreamDestroy();

                // Must happen after instream.instreamDestroy()
                _view.destroyInstream();

                _instream = null;

                // Re-attach the controller
                _controller.attachMedia();

                var oldMode = _model.get('preInstreamState');
                switch (oldMode) {
                    case 'instream-preroll':
                    case 'instream-midroll':
                        var item = _.extend({}, _olditem);
                        item.starttime = _oldpos;
                        _model.loadVideo(item);

                        // On error, mediaModel has buffering states in mobile, but oldProvider's state is playing.
                        // So, changing mediaModel's state to playing does not change provider state unless we do this
                        if (utils.isMobile() && (_model.mediaModel.get('state') === states.BUFFERING)) {
                            _oldProvider.setState(states.BUFFERING);
                        }
                        _oldProvider.play();
                        break;
                    case 'instream-postroll':
                    case 'instream-idle':
                        _oldProvider.stop();
                        break;
                }
            }
        };

        this.getState = function() {
            if (_instream && _instream._adModel) {
                return _instream._adModel.get('state');
            }
            // api expects false to know we aren't in instreamMode
            return false;
        };

        this.setText = function(text) {
            _view.setAltText(text ? text : '');
        };

        // This method is triggered by plugins which want to hide player controls
        this.hide = function() {
            _view.useExternalControls();
        };

    };

    _.extend(InstreamAdapter.prototype, Events);

    return InstreamAdapter;
});
