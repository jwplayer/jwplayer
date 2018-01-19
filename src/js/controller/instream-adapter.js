import { STATE_BUFFERING, STATE_COMPLETE, STATE_PAUSED,
    MEDIA_META, MEDIA_TIME, MEDIA_COMPLETE,
    PLAYLIST_ITEM, PLAYLIST_COMPLETE,
    INSTREAM_CLICK, AD_SKIPPED } from 'events/events';
import { BACKGROUND_LOAD_OFFSET, BACKGROUND_LOAD_MIN_OFFSET } from '../program/program-constants';
import Promise from 'polyfills/promise';
import { offsetToSeconds } from 'utils/strings';
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
    let _skipOffset;
    let _backgroundLoadStart;
    let _destroyed = false;
    let _inited = false;

    const _clickHandler = (evt) => {
        if (_destroyed) {
            return;
        }
        evt = evt || {};
        evt.hasControls = !!_model.get('controls');

        this.trigger(INSTREAM_CLICK, evt);

        // toggle playback after click event
        if (_adProgram.model.get('state') === STATE_PAUSED) {
            if (evt.hasControls) {
                _adProgram.playVideo();
            }
        } else {
            _adProgram.pause();
        }
    };

    const _doubleClickHandler = () => {
        if (_destroyed) {
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
        if (_inited || _destroyed) {
            return;
        }
        _inited = true;

        // Keep track of the original player state
        _adProgram.setup();

        _oldpos = _controller.get('position');
        _adProgram.on('all', _instreamForward, this);
        _adProgram.on(MEDIA_TIME, _instreamTime, this);
        _adProgram.on(MEDIA_COMPLETE, _instreamItemComplete, this);
        _adProgram.on(MEDIA_META, _instreamMeta, this);

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
            _view.clickHandler().setAlternateClickHandlers(() => {}, null);
        }

        this.setText(_model.get('localization').loadingAd);
        return this;
    };

    function _loadNextItem() {
        _arrayIndex++;
        _this.loadItem(_array);
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

        // Start background loading once the skip button is clickable
        // If no skipoffset is set, default to background loading 5 seconds before the end
        if (!_backgroundLoadStart) {
            // Ensure background loading doesn't degrade ad performance by starting too early
            _backgroundLoadStart = (offsetToSeconds(_skipOffset, duration) || duration) - BACKGROUND_LOAD_OFFSET;
        }
        if (!_backgroundLoadTriggered && position >= Math.max(_backgroundLoadStart, BACKGROUND_LOAD_MIN_OFFSET)) {
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
            if (e.type === MEDIA_COMPLETE) {
                // Dispatch playlist complete event for ad pods
                this.trigger(PLAYLIST_COMPLETE, {});
            }
            this.destroy();
        }
    }

    this.loadItem = function(item, options) {
        if (_destroyed || !_inited) {
            return Promise.reject(new Error('Instream not setup'));
        }
        // Copy the playlist item passed in and make sure it's formatted as a proper playlist item
        let playlist = item;
        if (_.isArray(item)) {
            _array = item;
            _arrayOptions = options || _arrayOptions;
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
        _skipOffset = item.skipoffset || _options.skipoffset;
        if (_skipOffset) {
            _this.setupSkipButton(_skipOffset, _options);
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
        if (_destroyed) {
            return;
        }
        // start listening for ad click
        if (_view.clickHandler()) {
            _view.clickHandler().setAlternateClickHandlers(_clickHandler, _doubleClickHandler);
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
    function _instreamMeta(evt) {
        // If we're getting video dimension metadata from the provider, allow the view to resize the media
        if (evt.width && evt.height) {
            _view.resizeMedia();
        }
    }

    this.replacePlaylistItem = function(item) {
        if (_destroyed) {
            return;
        }
        _model.set('playlistItem', item);
        _adProgram.srcReset();
    };

    this.destroy = function() {
        if (_destroyed) {
            return;
        }
        _destroyed = true;
        this.trigger('destroyed');
        this.off();

        if (_view.clickHandler()) {
            _view.clickHandler().revertAlternateClickHandlers();
        }

        _model.off(null, null, _adProgram);
        _adProgram.off(null, null, _this);
        _adProgram.destroy();

        // Sync player state with ad for model "change:state" events to trigger
        if (_inited && _adProgram.model) {
            const adState = _adProgram.model.get('state');
            _model.attributes.state = adState;
        }

        _model.set('instream', null);

        _adProgram = null;

        if (!_inited || _model.attributes._destroyed) {
            return;
        }

        // Re-attach the controller & resume playback
        // when instream was inited and the player was not destroyed\
        _controller.attachMedia(_oldpos);

        if (this.noResume) {
            return;
        }

        if (_oldpos === null) {
            _controller.stopVideo();
        } else {
            _controller.playVideo();
        }
    };

    this.getState = function() {
        if (_destroyed) {
            // api expects false to know we aren't in instreamMode
            return false;
        }
        return _adProgram.model.get('state');
    };

    this.setText = function(text) {
        if (_destroyed) {
            return;
        }
        _view.setAltText(text || '');
    };

    // This method is triggered by plugins which want to hide player controls
    this.hide = function() {
        if (_destroyed) {
            return;
        }
        _model.set('hideAdsControls', true);
    };

    /**
     * Extracts the video tag in the foreground.
     * @returns {Element|undefined} videoTag - the HTML <video> element in the foreground.
     */
    this.getMediaElement = function () {
        if (_destroyed) {
            return null;
        }
        return _adProgram.primedElement;
    };

    /**
     * Sets the internal skip offset. Does not set the skip button.
     * @param {Number} skipOffset - The number of seconds from the start where the ad becomes skippable.
     * @returns void
     */
    this.setSkipOffset = function(skipOffset) {
        // IMA will pass -1 if it doesn't know the skipoffset, or if the ad is unskippable
        _skipOffset = skipOffset > 0 ? skipOffset : null;
        if (_adProgram) {
            _adProgram.model.set('skipOffset', _skipOffset);
        }
    };
};

Object.assign(InstreamAdapter.prototype, Events);

export default InstreamAdapter;
