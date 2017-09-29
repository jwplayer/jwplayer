import { OS } from 'environment/environment';
import { STATE_BUFFERING, STATE_COMPLETE, STATE_PAUSED,
    ERROR, MEDIA_META, MEDIA_TIME, MEDIA_COMPLETE,
    PLAYLIST_ITEM, PLAYLIST_COMPLETE, INSTREAM_CLICK, AD_SKIPPED } from 'events/events';
import InstreamHtml5 from 'controller/instream-html5';
import InstreamFlash from 'controller/instream-flash';
import utils from 'utils/helpers';
import Events from 'utils/backbone.events';
import _ from 'utils/underscore';

function chooseInstreamMethod(_model) {
    var providerName = '';
    var provider = _model.get('provider');
    if (provider) {
        providerName = provider.name;
    }
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

    var _array;
    var _arrayOptions;
    var _arrayIndex = 0;
    var _options = {};
    var _oldpos;
    var _olditem;
    var _this = this;
    var _skipAd = _instreamItemNext;

    var _clickHandler = _.bind(function(evt) {
        evt = evt || {};
        evt.hasControls = !!_model.get('controls');

        this.trigger(INSTREAM_CLICK, evt);

        // toggle playback after click event
        if (!_instream || !_instream._adModel) {
            return;
        }
        if (_instream._adModel.get('state') === STATE_PAUSED) {
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
        if (_instream._adModel.get('state') === STATE_PAUSED) {
            if (_model.get('controls')) {
                _controller.setFullscreen();
                _controller.play();
            }
        }
    }, this);

    this.type = 'instream';

    this.init = function(sharedVideoTag) {
        // Keep track of the original player state
        const mediaElement = sharedVideoTag || _model.get('mediaElement');
        _oldpos = _model.get('position');
        _olditem = _model.get('playlist')[_model.get('item')];

        _instream.on('all', _instreamForward, this);
        _instream.on(MEDIA_TIME, _instreamTime, this);
        _instream.on(MEDIA_COMPLETE, _instreamItemComplete, this);
        _instream.init(mediaElement, _model.clone());

        // Make sure the original player's provider stops broadcasting events (pseudo-lock...)
        _controller.detachMedia();

        // Let the element finish loading for mobile before calling pause
        if (mediaElement) {
            if (!mediaElement.paused) {
                mediaElement.pause();
            }
            mediaElement.playbackRate = mediaElement.defaultPlaybackRate = 1;
        }

        if (_controller.checkBeforePlay() || (_oldpos === 0 && !_model.checkComplete())) {
            // make sure video restarts after preroll
            _oldpos = 0;
        } else if (_model.checkComplete() || _model.get('state') === STATE_COMPLETE) {
            _oldpos = null;
        }

        // Show instream state instead of normal player state
        _model.set('adModel', _instream._adModel);
        _view.setupInstream(_instream._adModel);
        _instream._adModel.set('state', STATE_BUFFERING);

        // don't trigger api play/pause on display click
        if (_view.clickHandler()) {
            _view.clickHandler().setAlternateClickHandlers(utils.noop, null);
        }

        this.setText(_model.get('localization').loadingAd);
        return this;
    };

    function _loadNextItem() {
        _arrayIndex++;
        var item = _array[_arrayIndex];
        var options;
        if (_arrayOptions) {
            options = _arrayOptions[_arrayIndex];
        }
        _this.loadItem(item, options);
    }

    function _instreamForward(type, data) {
        if (type === 'complete') {
            return;
        }
        data = data || {};

        if (_options.tag && !data.tag) {
            data.tag = _options.tag;
        }

        this.trigger(type, data);

        if (type === 'mediaError' || type === 'error') {
            if (_array && _arrayIndex + 1 < _array.length) {
                _loadNextItem();
            }
        }
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
        this.trigger(MEDIA_COMPLETE, data);
        _instreamItemNext.call(this, e);
    }

    function _instreamItemNext(e) {
        if (_array && _arrayIndex + 1 < _array.length) {
            _loadNextItem();
        } else {
            // notify vast of breakEnd
            this.trigger('adBreakEnd', {});
            if (e.type === MEDIA_COMPLETE) {
                // Dispatch playlist complete event for ad pods
                this.trigger(PLAYLIST_COMPLETE, {});
            }
            this.destroy();
        }
    }

    this.loadItem = function(item, options) {
        if (!_instream) {
            return;
        }
        if (OS.android && OS.version.major === 2 && OS.version.minor === 3) {
            this.trigger({
                type: ERROR,
                message: 'Error loading instream: Cannot play instream on Android 2.3'
            });
            return;
        }
        // Copy the playlist item passed in and make sure it's formatted as a proper playlist item
        let playlist = item;
        if (_.isArray(item)) {
            _array = item;
            _arrayOptions = options;
            item = _array[_arrayIndex];
            if (_arrayOptions) {
                options = _arrayOptions[_arrayIndex];
            }
        } else {
            playlist = [item];
        }

        const adModel = _instream._adModel;
        adModel.set('playlist', playlist);

        _model.set('hideAdsControls', false);

        // Dispatch playlist item event for ad pods
        _this.trigger(PLAYLIST_ITEM, {
            index: _arrayIndex,
            item: item
        });

        _options = Object.assign({}, _defaultOptions, options);

        _this.addClickHandler();

        adModel.set('skipButton', false);

        const playPromise = _instream.load(item);

        const skipoffset = item.skipoffset || _options.skipoffset;
        if (skipoffset) {
            _this.setupSkipButton(skipoffset, _options);
        }

        return playPromise;
    };

    this.setupSkipButton = function(skipoffset, options, customNext) {
        const adModel = _instream._adModel;
        if (customNext) {
            _skipAd = customNext;
        } else {
            _skipAd = _instreamItemNext;
        }
        adModel.set('skipMessage', options.skipMessage);
        adModel.set('skipText', options.skipText);
        adModel.set('skipOffset', skipoffset);
        adModel.set('skipButton', false);
        adModel.set('skipButton', true);
    };

    this.applyProviderListeners = function(provider) {
        _instream.applyProviderListeners(provider);

        this.addClickHandler();
    };

    this.play = function() {
        _instream.instreamPlay();
    };

    this.pause = function() {
        _instream.instreamPause();
    };

    this.addClickHandler = function() {
        // start listening for ad click
        if (_view.clickHandler()) {
            _view.clickHandler().setAlternateClickHandlers(_clickHandler, _doubleClickHandler);
        }

        _instream.on(MEDIA_META, this.metaHandler, this);
    };

    this.skipAd = function(evt) {
        var skipAdType = AD_SKIPPED;
        this.trigger(skipAdType, evt);
        _skipAd.call(this, {
            type: skipAdType
        });
    };

    /** Handle the MEDIA_META event **/
    this.metaHandler = function (evt) {
        // If we're getting video dimension metadata from the provider, allow the view to resize the media
        if (evt.width && evt.height) {
            _view.resizeMedia();
        }
    };

    this.destroy = function() {
        this.off();

        _model.set('adModel', null);

        if (_instream) {
            if (_view.clickHandler()) {
                _view.clickHandler().revertAlternateClickHandlers();
            }

            // Sync player state with ad for model "change:state" events to trigger
            const adState = _instream._adModel.get('state');
            _model.attributes.state = adState;

            _model.off(null, null, _instream);
            _instream.off(null, null, _this);
            _instream.instreamDestroy();

            // Must happen after instream.instreamDestroy()
            _view.destroyInstream();

            _instream = null;

            // Player was destroyed
            if (_model.attributes._destroyed) {
                return;
            }

            // Re-attach the controller
            _controller.attachMedia();

            if (_oldpos === null) {
                _model.stopVideo();
            } else {
                const mediaModelContext = _model.mediaModel;
                const item = Object.assign({}, _olditem);
                item.starttime = _oldpos;
                _model.attributes.playlistItem = item;
                _model.playVideo().catch(function(error) {
                    if (mediaModelContext === _model.mediaModel) {
                        _model.mediaController.trigger('error', {
                            message: error.message
                        });
                    }
                });
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
        _model.set('hideAdsControls', true);
    };

};

Object.assign(InstreamAdapter.prototype, Events);

export default InstreamAdapter;
