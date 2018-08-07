import { STATE_BUFFERING, STATE_COMPLETE, STATE_PLAYING, STATE_PAUSED,
    MEDIA_META, MEDIA_PLAY_ATTEMPT_FAILED, MEDIA_TIME, MEDIA_COMPLETE,
    PLAYLIST_ITEM, PLAYLIST_COMPLETE,
    INSTREAM_CLICK,
    AD_PLAY, AD_PAUSE, AD_TIME, AD_CLICK, AD_SKIPPED } from 'events/events';
import { BACKGROUND_LOAD_OFFSET, BACKGROUND_LOAD_MIN_OFFSET } from '../program/program-constants';
import Promise from 'polyfills/promise';
import { offsetToSeconds } from 'utils/strings';
import Events from 'utils/backbone.events';
import AdProgramController from 'program/ad-program-controller';

const _defaultOptions = {
    skipoffset: null,
    tag: null
};

/**
 * InstreamAdapter JW Player instream API. Instantiated via jwplayer().createInstream(). Only one instance can be
 * created per player. It is destroyed via jwplayer().instreamDestroy().
 * @param {Controller} _controller - The player controller instance
 * @param {Model} _model - The player model instance
 * @param {View} _view - The player view instance
 * @param {MediaPool} _mediaPool - The player media pool
 * @constructor
 */

const InstreamAdapter = function(_controller, _model, _view, _mediaPool) {
    const _this = this;

    let _adProgram = new AdProgramController(_model, _mediaPool);
    let _array;
    let _arrayOptions;
    let _arrayIndex = 0;
    let _options = {};
    let _skipAd = _instreamItemNext;
    let _backgroundLoadTriggered = false;
    let _skipOffset;
    let _backgroundLoadStart;
    let _destroyed = false;
    let _inited = false;
    let _beforeComplete = false;

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

    /**
     * Put the player in instream ads mode, detaching media, and preparing the ad program for
     * instream playback
     * @return {InstreamAdapter} - chainable
     */
    this.init = function() {
        if (_inited || _destroyed) {
            return;
        }
        _inited = true;

        // Keep track of the original player state
        _adProgram.setup();

        _adProgram.on('all', _instreamForward, this);
        _adProgram.on(MEDIA_PLAY_ATTEMPT_FAILED, triggerPlayRejected, this);
        _adProgram.on(MEDIA_TIME, _instreamTime, this);
        _adProgram.on(MEDIA_COMPLETE, _instreamItemComplete, this);
        _adProgram.on(MEDIA_META, _instreamMeta, this);

        // Make sure the original player's provider stops broadcasting events (pseudo-lock...)
        _controller.detachMedia();

        const mediaElement = _adProgram.primedElement;
        const mediaContainer = _model.get('mediaContainer');
        mediaContainer.appendChild(mediaElement);

        // This enters the player into instream mode
        _model.set('instream', _adProgram);
        _adProgram.model.set('state', STATE_BUFFERING);

        // don't trigger api play/pause on display click
        const clickHandler = _view.clickHandler();
        if (clickHandler) {
            clickHandler.setAlternateClickHandlers(() => {}, null);
        }

        this.setText(_model.get('localization').loadingAd);

        // We need to know if we're beforeComplete before we reattach, since re-attaching will toggle the beforeComplete flag back if set
        _beforeComplete = _controller.isBeforeComplete() || _model.get('state') === STATE_COMPLETE;

        return this;
    };

    /**
     * Put the player in SSAI ad mode. Detaches media listeners
     * to prevent player events from being triggered during a break.
     * @param {string} clickThroughUrl - Url to open on click while playing
     * @return {InstreamAdapter} - chainable
     */
    this.enableAdsMode = function(clickThroughUrl) {
        if (_inited || _destroyed) {
            return;
        }
        // Forward current provider events through instream
        _controller.routeEvents({
            mediaControllerListener: (type, data) => {
                this.trigger(type, data);
            }
        });
        _model.set('instream', _adProgram);
        _adProgram.model.set('state', STATE_PLAYING);
        _addClickHandler(clickThroughUrl);
        return this;
    };

    function _addClickHandler(clickThroughUrl) {
        // don't trigger api play/pause on display click
        const clickHandler = _view.clickHandler();
        if (clickHandler) {
            clickHandler.setAlternateClickHandlers((evt) => {
                if (_destroyed) {
                    return;
                }
                evt = evt || {};
                evt.hasControls = !!_model.get('controls');
                _this.trigger(INSTREAM_CLICK, evt);
                if (clickThroughUrl) {
                    if (_model.get('state') === STATE_PAUSED) {
                        _controller.playVideo();
                    } else {
                        _controller.pause();
                        if (clickThroughUrl) {
                            _controller.trigger(AD_CLICK, { clickThroughUrl });
                            window.open(clickThroughUrl);
                        }
                    }
                }
            }, null);
        }
    }

    function triggerPlayRejected() {
        _adProgram.model.set('playRejected', true);
    }

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

    /**
     * Update instream player state. If `event.newstate` is 'playing' trigger an 'adPlay' event.
     * If `event.newstate` is 'paused' trigger and 'adPause' event.
     * @param {AdPlayEvent|AdPauseEvent} event - An ad event object containing relavant ad data.
     * @return {void}
     */
    this.setState = function(event) {
        const { newstate } = event;
        const adModel = _adProgram.model;

        event.oldstate = adModel.get('state');

        adModel.set('state', newstate);

        if (newstate === STATE_PLAYING) {
            _controller.trigger(AD_PLAY, event);
        } else if (newstate === STATE_PAUSED) {
            _controller.trigger(AD_PAUSE, event);
        }
    };

    /**
     * Update instream time and trigger 'adTime' event.
     * @param {AdTimeEvent} event - An ad event object containing relavant ad data.
     * @return {void}
     */
    this.setTime = function(event) {
        _instreamTime(event);
        _controller.trigger(AD_TIME, event);
    };

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
        const data = {};
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

    /**
     * Load an Item, playing it as an insteam ad.
     * @param {Item|Array.<Item>} item - The ad item or ad pod array of items to be played.
     * @param {Object|Array.<Object>} options - The ad options or ad pod array of options.
     * @return {Promise} - The ad playback promise.
     */
    this.loadItem = function(item, options) {
        if (_destroyed || !_inited) {
            return Promise.reject(new Error('Instream not setup'));
        }
        // Copy the playlist item passed in and make sure it's formatted as a proper playlist item
        let playlist = item;
        if (Array.isArray(item)) {
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

        // Reset starttime so that if the same ad is replayed by a plugin, it reloads from the start
        item.starttime = 0;
        // Dispatch playlist item event for ad pods
        _this.trigger(PLAYLIST_ITEM, {
            index: _arrayIndex,
            item: item
        });

        _options = Object.assign({}, _defaultOptions, options);

        _setDefaultClickHandler();

        adModel.set('skipButton', false);

        const playPromise = _adProgram.setActiveItem(_arrayIndex);

        _backgroundLoadTriggered = false;
        _skipOffset = item.skipoffset || _options.skipoffset;
        if (_skipOffset) {
            _this.setupSkipButton(_skipOffset, _options);
        }
        return playPromise;
    };

    /**
     * Add a skip button.
     * @param {Number} skipoffset - The number of seconds from the start where the ad becomes skippable.
     * @param {Object} options - Custom skip button text and message.
     * @param {function} [customNext] - The skip callback.
     * @return {void}
     */
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

    /**
     * Attach the provider handling ad playback.
     * @param {Object} provider - The provider that will accept media commands and trigger media events.
     * @return {void}
     */
    this.applyProviderListeners = function(provider) {
        _adProgram.usePsuedoProvider(provider);
        _setDefaultClickHandler();
    };

    /**
     * Resume ad playback.
     * @return {void}
     */
    this.play = function() {
        _adProgram.playVideo();
    };

    /**
     * Pause ad playback.
     * @return {void}
     */
    this.pause = function() {
        _adProgram.pause();
    };

    function _setDefaultClickHandler() {
        if (_destroyed) {
            return;
        }
        // start listening for ad click
        if (_view.clickHandler()) {
            _view.clickHandler().setAlternateClickHandlers(_clickHandler, _doubleClickHandler);
        }
    }

    /**
     * Skip the current Ad.
     * @param {Object} event - The 'adSkipped' event object.
     * @return {void}
     */
    this.skipAd = function(event) {
        const skipAdType = AD_SKIPPED;
        this.trigger(skipAdType, event);
        _skipAd.call(this, {
            type: skipAdType
        });
    };

    function _instreamMeta(evt) {
        // If we're getting video dimension metadata from the provider, allow the view to resize the media
        if (evt.width && evt.height) {
            _view.resizeMedia();
        }
    }

    /**
     * Replace the current playlist item, with a new source. Used with SSAI plugins.
     * @param {Item} item - The new playlist item.
     * @return {void}
     */
    this.replacePlaylistItem = function(item) {
        if (_destroyed) {
            return;
        }
        _model.set('playlistItem', item);
        _adProgram.srcReset();
    };

    /**
     * Destroy this instream instance, reattach media and resume playback.
     * @return {void}
     */
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

        // Force player state with ad to pause for model "change:state" events to trigger
        if (_inited && _adProgram.model) {
            _model.attributes.state = STATE_PAUSED;
        }

        _controller.forwardEvents();
        _model.set('instream', null);

        _adProgram = null;

        if (!_inited || _model.attributes._destroyed) {
            return;
        }

        // Re-attach the controller & resume playback
        // when instream was inited and the player was not destroyed\
        _controller.attachMedia();

        if (_model.get('outstream')) {
            _model.set('state', 'complete');
            return;
        }
        if (this.noResume) {
            return;
        }

        if (_beforeComplete) {
            _controller.stopVideo();
        } else {
            _controller.playVideo();
        }
    };

    /**
     * Get the ad playback state. Returns false if destroyed.
     * @return {string|boolean} The ad player's playback state
     */
    this.getState = function() {
        if (_destroyed) {
            // api expects false to know we aren't in instreamMode
            return false;
        }
        return _adProgram.model.get('state');
    };

    /**
     * Update the ads mode controlbar message.
     * @param {string} text - The message to display in the controlbar.
     * @return {InstreamAdapter} - chainable
     */
    this.setText = function(text) {
        if (_destroyed) {
            return this;
        }
        _view.setAltText(text || '');
        return this;
    };

    /**
     * Hide the ads mode controls
     * @return {void}
     */
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
     * Sets the internal skip offset used for preloading content. Does not setup the skip button.
     * @param {Number} skipOffset - The number of seconds from the start where the ad becomes skippable.
     * @returns {void}
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
