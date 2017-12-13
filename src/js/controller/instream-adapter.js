import { OS } from 'environment/environment';
import { STATE_BUFFERING, STATE_COMPLETE, STATE_PAUSED,
    ERROR, MEDIA_META, MEDIA_TIME, MEDIA_COMPLETE,
    PLAYLIST_ITEM, PLAYLIST_COMPLETE, INSTREAM_CLICK, AD_SKIPPED } from 'events/events';
import utils from 'utils/helpers';
import Events from 'utils/backbone.events';
import _ from 'utils/underscore';
import AdProgramController from 'program/ad-program-controller';

var _defaultOptions = {
    skipoffset: null,
    tag: null
};

var InstreamAdapter = function(_controller, _model, _view, _mediaPool) {
    const _this = this;

    let _adProgram = new AdProgramController(_model, _mediaPool);
    let _array;
    let _arrayOptions;
    let _arrayIndex = 0;
    let _options = {};
    let _skipAd = _instreamItemNext;
    let _backgroundLoadTriggered = false;
    let _oldpos;
    let _backgroundLoadPosition;

    const _clickHandler = (evt) => {
        evt = evt || {};
        evt.hasControls = !!_model.get('controls');

        this.trigger(INSTREAM_CLICK, evt);

        // toggle playback after click event
        if (!_adProgram) {
            return;
        }

        if (_adProgram.model.get('state') === STATE_PAUSED) {
            if (evt.hasControls) {
                _adProgram.playVideo();
            }
        } else {
            _adProgram.pause();
        }
    };

    const _doubleClickHandler = () => {
        if (!_adProgram) {
            return;
        }

        if (_adProgram.model.get('state') === STATE_PAUSED) {
            if (_model.get('controls')) {
                _controller.setFullscreen();
                _controller.play();
            }
        }
    };

    this.type = 'instream';

    this.init = function() {
        // Keep track of the original player state
        _adProgram.setup();

        _oldpos = _controller.get('position');
        _adProgram.on('all', _instreamForward, this);
        _adProgram.on(MEDIA_TIME, _instreamTime, this);
        _adProgram.on(MEDIA_COMPLETE, _instreamItemComplete, this);

        // Make sure the original player's provider stops broadcasting events (pseudo-lock...)
        _controller.detachMedia();

        const mediaElement = _adProgram.primedElement;
        const mediaContainer = _model.get('mediaContainer');
        mediaContainer.appendChild(mediaElement);

        if (_controller.checkBeforePlay() || (_oldpos === 0 && !_controller.isBeforeComplete())) {
            // make sure video restarts after preroll
            _oldpos = 0;
        } else if (_controller.isBeforeComplete() || _model.get('state') === STATE_COMPLETE) {
            _oldpos = null;
        }

        // This enters the player into instream mode
        _model.set('instream', _adProgram);
        _adProgram.model.set('state', STATE_BUFFERING);

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
        const { duration, position } = evt;
        const mediaModel = _adProgram.model.mediaModel || _adProgram.model;
        mediaModel.set('duration', duration);
        mediaModel.set('position', position);

        if (!_backgroundLoadTriggered && position >= _backgroundLoadPosition) {
            _controller.preloadNextItem();
            _backgroundLoadTriggered = true;
        }
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
        if (!_adProgram) {
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

        const adModel = _adProgram.model;
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

        const playPromise = _adProgram.setActiveItem(_arrayIndex);

        _backgroundLoadTriggered = false;
        const skipoffset = item.skipoffset || _options.skipoffset;
        if (skipoffset) {
            // Start background loading once the skip button is clickable
            _this.setupSkipButton(skipoffset, _options);
            _backgroundLoadPosition = skipoffset;
        } else {
            // If no skipoffset is set, default to background loading 5 seconds before the end
            _backgroundLoadPosition = item.duration - 5;
        }

        return playPromise;
    };

    this.setupSkipButton = function(skipoffset, options, customNext) {
        const adModel = _adProgram.model;
        if (customNext) {
            _skipAd = customNext;
        } else {
            _skipAd = _instreamItemNext;
        }
        adModel.set('skipMessage', options.skipMessage);
        adModel.set('skipText', options.skipText);
        adModel.set('skipOffset', skipoffset);
        adModel.attributes.skipButton = false;
        adModel.set('skipButton', true);
    };

    this.applyProviderListeners = function(provider) {
        _adProgram.usePsuedoProvider(provider);

        this.addClickHandler();
    };

    this.play = function() {
        _adProgram.playVideo();
    };

    this.pause = function() {
        _adProgram.pause();
    };

    this.addClickHandler = function() {
        // start listening for ad click
        if (_view.clickHandler()) {
            _view.clickHandler().setAlternateClickHandlers(_clickHandler, _doubleClickHandler);
        }

        if (_adProgram) {
            _adProgram.on(MEDIA_META, this.metaHandler, this);
        }
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

    this.replacePlaylistItem = function(item) {
        _model.set('playlistItem', item);
    };

    this.destroy = function() {
        this.off();

        if (_view.clickHandler()) {
            _view.clickHandler().revertAlternateClickHandlers();
        }

        if (_adProgram) {
            // Sync player state with ad for model "change:state" events to trigger
            if (_adProgram.model) {
                const adState = _adProgram.model.get('state');
                _model.attributes.state = adState;
            }

            const mediaElement = _adProgram.primedElement;
            const mediaContainer = _model.get('mediaContainer');
            if (mediaElement.parentNode === mediaContainer) {
                mediaContainer.removeChild(mediaElement);
            }

            _model.off(null, null, _adProgram);
            _adProgram.off(null, null, _this);
            _adProgram.destroy();

            // Must happen after instream.instreamDestroy()
            _model.set('instream', null);

            _adProgram = null;

            // Player was destroyed
            if (_model.attributes._destroyed) {
                return;
            }

            // Re-attach the controller
            _controller.attachMedia(_oldpos);

            if (_oldpos === null) {
                _controller.stopVideo();
            } else {
                _controller.playVideo();
            }
        }
    };

    this.getState = function() {
        if (_adProgram && _adProgram.model) {
            return _adProgram.model.get('state');
        }
        // api expects false to know we aren't in instreamMode
        return false;
    };

    this.setText = function(text) {
        _view.setAltText(text || '');
    };

    // This method is triggered by plugins which want to hide player controls
    this.hide = function() {
        _model.set('hideAdsControls', true);
    };

    /**
     * Extracts the video tag in the foreground.
     * @returns {Element|undefined} videoTag - the HTML <video> element in the foreground.
     */
    this.getMediaElement = function () {
        if (_adProgram) {
            return _adProgram.primedElement;
        }
    };
};

Object.assign(InstreamAdapter.prototype, Events);

export default InstreamAdapter;
