define([
    'controller/instream-html5',
    'controller/instream-flash',
    'view/adskipbutton',
    'events/events',
    'events/states',
    'utils/helpers',
    'utils/backbone.events',
    'utils/underscore'
], function(InstreamHtml5, InstreamFlash, AdSkipButton, events, states, utils, Events, _) {

    function chooseInstreamMethod(_model) {
        if (_model.get('provider') === 'flash') {
            return InstreamFlash;
        }

        return InstreamHtml5;
    }

    var InstreamProxy = function(_model, _view) {

        var InstreamMethod = chooseInstreamMethod(_model);
        var _instream = new InstreamMethod(this, _model);

        var _item,
            _options,
            _this = this;

        this.type = 'instream';

        this.init = function() {

            _instream.on('all', function(type, data) {
                data = data || {};

                if (_instream.options.tag && !data.tag) {
                    data.tag = _instream.options.tag;
                }

                this.trigger(type, data);
            }, this);

            _instream.addEventListener(events.JWPLAYER_MEDIA_TIME, function(evt) {
                if (_this._skipButton) {
                    _this._skipButton.updateMediaTime(evt.position, evt.duration);
                }
            });
            _instream.init();

            // Show instream state instead of normal player state
            _view.setupInstream(_instream._adModel);

            this.setText('Loading ad');
            return this;
        };

        this.loadItem = function(item, options) {
            if (utils.isAndroid(2.3)) {
                _this.trigger({
                    type: events.JWPLAYER_ERROR,
                    message: 'Error loading instream: Cannot play instream on Android 2.3'
                });
                return;
            }
            _item = item;
            _options = options || {};
            _instream.load(item, options);

            this.addClickHandler();

            // Show the instream layer
            _view.showInstream();

            if (_options.skipoffset) {
                this._skipButton = new AdSkipButton(_options.skipMessage, _options.skipText);
                this._skipButton.on(events.JWPLAYER_AD_SKIPPED, this.skipAd, this);
                this._skipButton.setWaitTime(_options.skipoffset);

                _view.controlsContainer().appendChild(this._skipButton.element());
            }
        };

        this.play = function() {
            _instream.instreamPlay();
        };

        this.pause = function() {
            _instream.instreamPause();
        };

        this.showProvider = function() {
            // show the provider which is playing an ad (flash)
            // TODO:: Do we need this?
            //_oldProvider.setVisibility(true);
        };

        this.hide = function() {
            _instream.hide();
        };

        this.addClickHandler = function() {
            // start listening for ad click
            _view.clickHandler().setAlternateClickHandler(function (evt) {
                evt = evt || {};
                evt.hasControls = !!_model.get('controls');

                _this.trigger(events.JWPLAYER_INSTREAM_CLICK, evt);

                // toggle playback after click event

                if (_instream._adModel.state === states.PAUSED) {
                    if (evt.hasControls) {
                        _this.instreamPlay();
                    }
                } else {
                    _this.instreamPause();
                }
            });

            //if (utils.isMSIE()) {
                //_oldProvider.parentElement.addEventListener('click', _view.clickHandler().clickHandler);
            //}

            _view.on(events.JWPLAYER_AD_SKIPPED, this.skipAd, this);
            _instream.on(events.JWPLAYER_MEDIA_META, this.metaHandler, this);

        };

        this.skipAd = function() {
            _instream.trigger(events.JWPLAYER_AD_SKIPPED);
            _instream.completeHandler();
        };


        /** Handle the JWPLAYER_MEDIA_META event **/
        this.metaHandler = function (evt) {
            // If we're getting video dimension metadata from the provider, allow the view to resize the media
            if (evt.width && evt.height) {
                //_view.releaseState();
                _view.resizeMedia();
            }
        };

        this.destroy = function() {
            this.off();

            if (_instream) {
                var adsVideo = _instream._adModel.getVideo();
                _view.destroyInstream((adsVideo) ? adsVideo.isAudioFile() : false);
                if (_view.clickHandler()) {
                    //if (_oldProvider && _oldProvider.parentElement) {
                        //_oldProvider.parentElement.removeEventListener('click', _view.clickHandler().clickHandler);
                    //}
                    _view.clickHandler().revertAlternateClickHandler();
                }
                _instream.instreamDestroy();
                _instream = null;
            }
            if (this._skipButton) {
                _view.controlsContainer().removeChild(this._skipButton.element());
            }
        };

        this.getState = function() {
            return _instream.instreamState();
        };

        this.setText = function(text) {
            _view.setAltText(text ? text : '');
        };

        // This method is triggered by plugins which want to hide player controls
        this.hide = function() {
            _view.useExternalControls();
        };

    };

    _.extend(InstreamProxy.prototype, Events);

    return InstreamProxy;
});