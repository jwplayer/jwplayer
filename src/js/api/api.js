import ApiSettings from 'api/api-settings';
import * as Environment from 'environment/environment';
import instances from './players';
import Core from './core-shim';
import { version } from '../version';
import { STATE_PLAYING, STATE_BUFFERING, READY } from 'events/events';
import Timer from 'api/timer';
import Events, { on, once, off, trigger, triggerSafe } from 'utils/backbone.events';
import { registerPlugin } from 'plugins/plugins';
import utils from 'utils/helpers';
import _ from 'utils/underscore';

let instancesCreated = 0;

/**
 * Factory method which creates controllers before calling `jwplayer().setup()`.
 * @param {Api} api - The Player API instance to bind core to
 * @param {HTMLElement} element - The element that will be replaced by the player's div container
 * @returns {Core} The core controller instance
 * @private
 */
function coreFactory(api, element) {
    const core = new Core(element);

    // capture the ready event and add setup time to it
    core.on(READY, (event) => {
        api._qoe.tick('ready');
        event.setupTime = api._qoe.between('setup', 'ready');
    });
    core.on('all', (type, event) => {
        api.trigger(type, event);
    });

    return core;
}

/**
 * Detaches Api event listeners and destroys the controller.
 * @param {Api} api - The Player API to remove listeners from
 * @param {Core} core - The core controller to destroy
 * @returns {void}
 * @private
 */
function resetPlayer(api, core) {
    const plugins = api.plugins;
    Object.keys(plugins).forEach(key => {
        delete plugins[key];
    });
    if (core.get('setupConfig')) {
        api.trigger('remove');
    }
    api.off();
    core.playerDestroy();
    if (!__HEADLESS__) {
        core.getContainer().removeAttribute('data-jwplayer-id');
    }
}

/**
 * Removes the Api instance from the list of active players.
 * The instance will no longer be queryable via `jwplayer()`
 * @param {Api} api - The Player API to remove
 * @returns {void}
 * @private
 */
function removePlayer(api) {
    for (let i = instances.length; i--;) {
        if (instances[i].uniqueId === api.uniqueId) {
            instances.splice(i, 1);
            break;
        }
    }
}

/**
 * Class representing the jwplayer() API.
 * Creates an instance of the player.
 * @class Api
 * @param {HTMLElement} element - The element that will be replaced by the player's div container.
 */
export default function Api(element) {
    // Add read-only properties which access privately scoped data

    // `uniqueId` should start at 1
    const uniqueId = ++instancesCreated;
    const playerId = element.id || `player-${uniqueId}`;
    const qoeTimer = new Timer();
    const pluginsMap = {};

    let core = coreFactory(this, element);

    qoeTimer.tick('init');
    if (!__HEADLESS__) {
        element.setAttribute('data-jwplayer-id', playerId);
    }

    Object.defineProperties(this, /** @lends Api.prototype */ {
        /**
         * The player's query id.
         * This matches the id of the element used to create the player at the time is was setup.
         * @type string
         * @readonly
         */
        id: {
            enumerable: true,
            get() {
                return playerId;
            }
        },
        /**
         * The player's unique id.
         * @type number
         * @readonly
         */
        uniqueId: {
            enumerable: true,
            get() {
                return uniqueId;
            }
        },
        /**
         * A map of plugin instances.
         * @type object
         * @readonly
         */
        plugins: {
            enumerable: true,
            get() {
                return pluginsMap;
            }
        },
        /**
         * The internal QoE Timer.
         * @type Timer
         * @readonly
         */
        _qoe: {
            enumerable: true,
            get() {
                return qoeTimer;
            }
        },

        /**
         * @return {string} The player API version.
         * @type string
         * @readonly
         */
        version: {
            enumerable: true,
            get() {
                return version;
            }
        },

        /**
         * Returns the Events module from the player instance.
         * Used by plugins to listen to player events.
         * @deprecated TODO: in version 8.0.0-0
         * @readonly
         */
        Events: {
            enumerable: true,
            get() {
                return Events;
            }
        },

        /**
         * Returns the Utils module from the player instance.
         * Used by plugins.
         * @deprecated TODO: in version 8.0.0-0
         * @readonly
         */
        utils: {
            enumerable: true,
            get() {
                return utils;
            }
        },

        /**
         * Returns the Underscore module from the player instance.
         * Used by plugins.
         * @deprecated TODO: in version 8.0.0-0
         * @readonly
         */
        _: {
            enumerable: true,
            get() {
                return _;
            }
        },

    });

    Object.assign(this, /** @lends Api.prototype */ {
        /**
         * A map of event listeners.
         * @type object
         * @readonly
         */
        _events: {},

        /**
         * Creates a new player on the page and asynchronously begins setup.
         * A "ready" event is triggered on success.
         * A "setupError" event is triggered on failure.
         * @param {object} options - The player configuration options.
         * @returns {Api} The Player API instance
         */
        setup(options) {
            qoeTimer.clear('ready');
            qoeTimer.tick('setup');

            resetPlayer(this, core);
            core = coreFactory(this, element);
            core.init(options, this);

            // bind event listeners passed in to the config
            return this.on(options.events, null, this);
        },

        /** Asynchronously removes the player from the page.
         * A "remove" event is fired once removal begins.
         * Playback is stopped, and the DOM used by the player is reset.
         * All event listeners attached to the player are removed.
         * @returns {Api} The Player API instance
         */
        remove() {
            // Remove from array of players
            removePlayer(this);

            // Unbind listeners and destroy controller/model/...
            resetPlayer(this, core);

            return this;
        },

        /**
         * Gets the QoE properties of the player and current playlist item.
         * @returns {PlayerQoE} An object containing a snapshot of QoE metrics.
         */
        qoe() {
            const qoeItem = core.getItemQoe();

            const setupTime = this._qoe.between('setup', 'ready');
            const firstFrame = qoeItem.getFirstFrame ? qoeItem.getFirstFrame() : null;

            /** Player QoE returned from {@link Api#qoe jwplayer().qoe()}
             * @typedef {object} PlayerQoE
             * @property {number} setupTime - The number of milliseconds from `jwplayer().setup()` to the "ready" event.
             * @property {number} firstFrame - The number of milliseconds from the "playAttempt" event to the "firstFrame" event.
             * @property {TimerMetrics} player - The QoE metrics of the player.
             * @property {TimerMetrics} item - The QoE metrics of the current playlist item.
             */
            // {setupTime: number, firstFrame: number, player: object, item: object}
            return {
                setupTime: setupTime,
                firstFrame: firstFrame,
                player: this._qoe.dump(),
                item: qoeItem.dump()
            };
        },

        /**
         * Adds to the list of cues to be displayed on the time slider.
         * New cues are appended to cues already on the time slider.
         * @param {Array.<SliderCue>} sliderCues - The list of cues.
         * @returns {Api} The Player API instance.
         */
        addCues(sliderCues) {
            if (Array.isArray(sliderCues)) {
                core.addCues(sliderCues);
            }
            return this;
        },

        /**
         * Gets the list of available audio tracks.
         * @returns {Array.<AudioTrackOption>} An array of AudioTrackOption objects representing the current media's audio tracks.
         */
        getAudioTracks() {
            return core.getAudioTracks();
        },

        /**
         * Gets the percentage of the media's duration which has been buffered.
         * @returns {number} A number from 0-100 indicating the percentage of media buffered.
         */
        getBuffer() {
            return core.get('buffer');
        },

        /**
         * Gets the captions style.
         * @returns {object} The captions styling configuration
         */
        getCaptions() {
            return core.get('captions');
        },

        // defined in controller/captions
        /**
         * Captions Track information for tracks returned by {@link Api#getCaptionsList jwplayer().getCaptionsList()}
         * @typedef {object} CaptionsTrackOption
         * @property {string} id
         * @property {string} label
         */

        /**
         * Gets the list of available captions tracks.
         * The first item in the array will always be the "off" option, regardless of whether the media contains captions.
         * @returns {Array.<CaptionsTrackOption>} An array of CaptionsTrackOption objects.
         */
        getCaptionsList() {
            return core.getCaptionsList();
        },

        /**
         * Gets a static representation of the player's model.
         * @returns {object} A copy of the player model.
         */
        getConfig() {
            return core.getConfig();
        },

        /**
         * Gets the player's top level DOM element.
         * @returns {HTMLElement} The player's div container.
         */
        getContainer() {
            return core.getContainer();
        },

        /**
         * Gets whether or not controls are enabled.
         * @returns {boolean} Are controls enabled?
         */
        getControls() {
            return core.get('controls');
        },

        /**
         * Gets the list of cues displayed in the timeslider.
         * @returns {Array.<SliderCue>} sliderCues - The list of cues.
         */
        getCues() {
            return core.get('cues');
        },

        /**
         * Gets the index of the active audio track.
         * @returns {number} The index of the active audio track, or -1 if there are no alternative audio tracks.
         */
        getCurrentAudioTrack() {
            return core.getCurrentAudioTrack();
        },

        /**
         * Gets the index of the active captions selection.
         * @returns {number} The index of the active selection option, or 0 if captions are off.
         */
        getCurrentCaptions() {
            return core.getCurrentCaptions();
        },

        /**
         * Gets the index of the active quality selection.
         * @returns {number} The index of the active quality level.
         */
        getCurrentQuality() {
            return core.getCurrentQuality();
        },

        /**
         * Gets the current value for video.currentTime
         * @returns {number} The value for video.currentTime in seconds
         */
        getCurrentTime() {
            return core.get('currentTime');
        },

        /**
         * Gets the duration of the current playlist item.
         * @returns {number} The duration in seconds.
         * Live streams always return `Infinity`.
         * DVR streams return a negative value, indicating how far back playback is from the live edge.
         */
        getDuration() {
            return core.get('duration');
        },

        /**
         * Environment information for the current session, return by {@link Api#getEnvironment jwplayer().getEnvironment()}
         * @typedef {object} Environment
         * @property {BrowserEnvironment} Browser - Information about the current session's browser.
         * @property {OSEnvironment} OS - Information about the current session's operating system.
         * @property {FeatureEnvironment} Features - Information about the current sessions's supported features.
         */

        /**
         * Gets information about the current session's environment
         * @returns {Environment} An object detailing the current session's browser, operating system, and supported features.
         */
        getEnvironment() {
            return Environment;
        },

        /**
         * Gets the player's fullscreen state.
         * @returns {boolean} Whether or not the player is in fullscreen mode.
         */
        getFullscreen() {
            return core.get('fullscreen');
        },

        /**
         * Gets the player's height.
         * @returns {number} The height of the player in pixels.
         */
        getHeight() {
            return core.getHeight();
        },

        /**
         * Gets all metadata for the current playlist item.
         * @returns {object} The merged result of the current playlist item's "meta" events.
         */
        getItemMeta() {
            return core.get('itemMeta') || {};
        },

        /**
         * Gets the player's mute state.
         * @returns {boolean} Whether or not the player is muted.
         */
        getMute() {
            return core.getMute();
        },

        /**
         * Gets the rate at which playback should occur while media is playing.
         * @default 1.0
         * @returns {number} The playback rate of the media element (`HTMLMediaElement.playbackRate`).
         * @since v7.12.0
         */
        getPlaybackRate() {
            return core.get('playbackRate');
        },

        /**
         * Gets the player's playlist.
         * @returns {Array.<PlaylistItem>} An array of PlaylistItem objects.
         */
        getPlaylist() {
            return core.get('playlist');
        },

        /**
         * Gets the index of the current playlist item.
         * @returns {number} The index of the current playlist item.
         */
        getPlaylistIndex() {
            return core.get('item');
        },

        /**
         * Gets the current playlist item, or the item specified by `index`.
         * @param {number} [index] A 0-based index of the desired playlist item.
         * @returns {PlaylistItem|null} Returns `null` when `index` is out of range.
         */
        getPlaylistItem(index) {
            if (!utils.exists(index)) {
                return core.get('playlistItem');
            }
            const playlist = this.getPlaylist();
            if (playlist) {
                return playlist[index];
            }
            return null;
        },

        /**
         * Gets the current playback time of the active media item.
         * @returns {number} The current playback time in seconds.
         * Live streams return the number of seconds played relative to when playback started (not since the live stream started).
         * DVR streams return a negative value, indicating how far playback is from the live edge.
         */
        getPosition() {
            return core.get('position');
        },

        /**
         * @typedef {object} ProviderInfo
         * @property {string} name - The name of the Provider handling playback.
         */

        /**
         * Gets information about how the player is handling playback.
         * @returns {ProviderInfo} An object containing the name of the current playback provider.
         */
        getProvider() {
            return core.getProvider();
        },

        /**
         * Gets the list of available quality options.
         * @returns {Array.<QualityOption>} An array of QualityOption objects.
         */
        getQualityLevels() {
            return core.getQualityLevels();
        },

        /**
         * @typedef {object} SafeRegion
         * @property {number} x - The position in pixels from the left of the player, not covered by controls.
         * @property {number} y -  The position in pixels from the top of the player, not covered by controls.
         * @property {number} width - The width of the safe region.
         * @property {number} height - The height of the safe region.
         */

        /**
         * Gets the area of the player not obscured by controls.
         * @param {boolean} [excludeControlbar=true] When set to false, the safe region will not exclude
         * the area used by the controlbar.
         * @returns {SafeRegion} The SafeRegion calculated using the player's current width, height
         * and controlbar when not excluded.
         */
        getSafeRegion(excludeControlbar = true) {
            return core.getSafeRegion(excludeControlbar);
        },

        /**
         * Gets the player state.
         * @returns {'idle'|'buffering'|'playing'|'paused'|'complete'} The current state of the player.
         */
        getState() {
            return core.getState();
        },

        /** Gets the mode of stretching used to fit media in the player.
         * @returns {'uniform'|'exactfit'|'fill'|'none'} The current stretch mode.
         */
        getStretching() {
            return core.get('stretching');
        },

        /**
         * Gets the player's viewability.
         * @returns {1|0} Returns `1` when more than half the player is in the document viewport and the page's tab is active.
         * Also returns `1` when the player is in fullscreen mode. `0` otherwise.
         * @since v7.10.0
         */
        getViewable() {
            return core.get('viewable');
        },

        /**
         * @typedef {object} VisualQuality
         * @property {QualityOption} level - The quality option associated with the active visual quality.
         * @property {'auto'|'manual'} mode - Whether the quality was selected automatically (adaptive quality switch) or manually.
         * @property {string|'initial choice'|'auto'|'api'} reason - The reason for the quality change.
         * @property {number} [bitrate] - The bitrate of the the active visual quality.
         */

        /**
         * Gets information about the visual quality of the active media.
         * @returns {VisualQuality} The last VisualQuality object returned for the current playlist item.
         */
        getVisualQuality() {
            return core.getVisualQuality();
        },

        /**
         * Gets the player's volume level.
         * @returns {number} A number from 0-100.
         */
        getVolume() {
            return core.get('volume');
        },

        /**
         * Gets the player's width.
         * @returns {number} The width of the player in pixels.
         */
        getWidth() {
            return core.getWidth();
        },

        /**
         * Sets captions styles.
         * @param {object} captionsStyles - The captions styling configuration to apply.
         * @returns {Api} The Player API instance.
         * @since v7.5.0
         */
        setCaptions(captionsStyles) {
            core.setCaptions(captionsStyles);
            return this;
        },

        /**
         * Updates the player's config options.
         * @param {object} options - The configuration options to update.
         * @returns {Api} The Player API instance.
         * @since v7.12.0
         */
        setConfig(options) {
            core.setConfig(options);
            return this;
        },

        /**
         * Toggles player controls.
         * @param {boolean} [toggle] - Specifies whether controls should be enabled or disabled.
         * @returns {Api} The Player API instance.
         */
        setControls(toggle) {
            core.setControls(toggle);
            return this;
        },

        /**
         * Sets the active audio track.
         * @param {number} index - The index of the audio track to select.
         * @returns {void}
         */
        setCurrentAudioTrack(index) {
            core.setCurrentAudioTrack(index);
            // TODO: return this;
        },

        /**
         * Sets the active captions option.
         * @param {number} index - The index of the captions option to select.
         * @returns {void}
         */
        setCurrentCaptions(index) {
            core.setCurrentCaptions(index);
            // TODO: return this;
        },

        /**
         * Sets the active quality option.
         * @param {number} index - The index of the quality level to select.
         * @returns {void}
         */
        setCurrentQuality(index) {
            core.setCurrentQuality(index);
            // TODO: return this;
        },

        /**
         * Toggles fullscreen state. Most browsers require a user gesture to trigger entering fullscreen mode.
         * @param {boolean} [toggle] - Specifies whether to enter or exit fullscreen mode.
         * @returns {Api} The Player API instance.
         */
        setFullscreen(toggle) {
            core.setFullscreen(toggle);
            return this;
        },

        /**
         * Toggles the player's mute state.
         * @param {boolean} [toggle] - Specifies whether to mute or unmute the player.
         * @returns {Api} The Player API instance.
         */
        setMute(toggle) {
            core.setMute(toggle);
            return this;
        },

        /**
         * Sets the player's default playeback rate. During playback, the rate of the current media will be set immediately if supported. Not supported when streaming live.
         * @param {number} playbackRate - The desired rate of playback. Limited to numbers between 0.25-4.0.
         * @returns {Api} The Player API instance.
         * @since v7.12.0
         */
        setPlaybackRate(playbackRate) {
            core.setPlaybackRate(playbackRate);
            return this;
        },

        /**
         * Sets playlist item specified by `index`.
         * @param {number} [index] A 0-based index of the desired playlist item.
         * @param {PlaylistItem} item The new playlist item.
         * @returns {Api} The Player API instance.
         */

        setPlaylistItem(index, item) {
            core.setPlaylistItem(index, item);
            return this;
        },

        /**
         * @typedef {object} SliderCue
         * @property {number} begin - The time at which the cue should be placed in seconds.
         * @property {string} text - The text label of the cue.
         */

        /**
         * Sets the list of cues to be displayed on the time slider.
         * @param {Array.<SliderCue>} sliderCues - The list of cues.
         * @returns {Api} The Player API instance.
         */
        setCues(sliderCues) {
            if (Array.isArray(sliderCues)) {
                core.setCues(sliderCues);
            }
            return this;
        },

        /**
         * Set the player's volume level.
         * @param {number} level - A value from 0-100.
         * @returns {Api} The Player API instance.
         */
        setVolume(level) {
            core.setVolume(level);
            return this;
        },

        /**
         * Stop any active playback, and loads either a new playlist, a new playlist item,
         * or an item already in the current playlist.
         * @param {string|Array.<PlaylistItem>|PlaylistItem|number} toLoad - The feed url, playlist,
         * playlist item, or playlist item index to load.
         * @param {object} [feedData] - The feed data to associate with playlist items.
         * Only applied when passing in a playlist or playlist items.
         * @returns {Api} The Player API instance.
         */
        load(toLoad, feedData) {
            core.load(toLoad, feedData);
            return this;
        },

        /**
         * Starts playback.
         * @param {object} [meta] - An optional argument used to specify cause.
         * @return {Api} The Player API instance.
         */
        play(meta) {
            core.play(meta);
            return this;
        },

        /**
         * Pauses playback.
         * @param {object} [meta] - An optional argument used to specify cause.
         * @return {Api} The Player API instance.
         */
        pause(meta) {
            core.pause(meta);
            return this;
        },

        /**
         * Toggles playback between play and pause.
         * @param {object} [meta] - An optional argument used to specify cause.
         * @return {Api} The Player API instance.
         */

        playToggle(meta) {
            switch (this.getState()) {
                case STATE_PLAYING:
                case STATE_BUFFERING:
                    return this.pause(meta);
                default:
                    return this.play(meta);
            }
        },

        /**
         * Seeks to a specific time within the active media. Resumes playback if the player is paused.
         * @param {number} position - The time to seek to.
         * @param {object} [meta] - An optional argument used to specify cause.
         * @returns {Api} The Player API instance.
         */
        seek(position, meta) {
            core.seek(position, meta);
            return this;
        },

        /**
         * Stops any active playback, and plays the item at the 0-based index in the playlist.
         * @param {number} index - If outside the range of the playlist,
         * the value will be wrapped to the playlist length.
         * @param {object} [meta] - An optional argument used to specify cause.
         * @returns {Api} The Player API instance.
         */
        playlistItem(index, meta) {
            core.playlistItem(index, meta);
            return this;
        },

        /**
         * Stops any active playback, and plays the next item in the playlist.
         * When the player is at the end of the playlist, this will play the first playlist item.
         * @param {object} [meta] - An optional argument used to specify cause.
         * @returns {Api} The Player API instance.
         */
        playlistNext(meta) {
            core.playlistNext(meta);
            return this;
        },

        /**
         * Stops any active playback, and plays the previous item in the playlist.
         * When the player is at the beginning of the playlist, this will play the last playlist item.
         * @param {object} [meta] - An optional argument used to specify cause.
         * @returns {Api} The Player API instance.
         */
        playlistPrev(meta) {
            core.playlistPrev(meta);
            return this;
        },

        /**
         * Stops any active playback, and plays the next up item specified by the related plugin.
         * The next up item is the next playlist item, or the first recommended video when at the end of the playlist.
         * @param {object} [meta] - An optional argument used to specify cause.
         * @returns {Api} The Player API instance.
         * @since v7.7.0
         */
        next(meta) {
            core.next(meta);
            return this;
        },

        /**
         * Toggles the presence of the Airplay button in Safari (calls `HTMLMediaElement.webkitShowPlaybackTargetPicker`).
         * Does not affect the Chromecast button in Chrome.
         * @returns {Api} The Player API instance.
         */
        castToggle() {
            core.castToggle();
            return this;
        },

        /**
         * Creates a new instance of the instream adapter. If present, the previous instance created is destroyed first.
         * @returns {InstreamAdapter} The instream instance.
         */
        createInstream() {
            return core.createInstream();
        },

        /**
         * Stops any active playback.
         * @returns {Api} The Player API instance.
         */
        stop() {
            core.stop();
            return this;
        },

        /**
         * Sets the player width and height.
         * @param {number|string} width - Set the width in pixel (number) or CSS measurement units ('100%', '100em')
         * @param {number|string} [height] - Set the height in pixel (number) or CSS measurement units ('100%', '100em')
         * When specified, the "aspectratio" option included at setup is cleared.
         * @returns {Api} The Player API instance.
         */
        resize(width, height) {
            core.resize(width, height);
            return this;
        },

        /** Adds or updates a button in the player's control bar. The button is only displayed when controls are active.
         * @param {string} img - The image that will be used as the button icon.
            Can be the url to an image or the content of an SVG in string.
         * @param {string} tooltip - A tooltip label to display when the button is hovered.
         * @param {function} callback - A callback to invoke when the button is clicked.
         * @param {string} id - The id of the button to add or update.
         * @param {string} [btnClass] - CSS classes to add to the button element.
         * @returns {Api} The Player API instance.
         */
        addButton(img, tooltip, callback, id, btnClass) {
            core.addButton(img, tooltip, callback, id, btnClass);
            return this;
        },

        /**
         * Removes a button from the player's control bar.
         * @param {string} id - The id of the button to remove.
         * @returns {Api} The Player API instance.
         */
        removeButton(id) {
            core.removeButton(id);
            return this;
        },

        /**
         * Reattaches a player instance to it's underlying video tag.
         * @returns {Api} The Player API instance.
         * @deprecated
         */
        attachMedia() {
            core.attachMedia();
            return this;
        },

        /**
         * Detaches a player instance from it's underlying video tag.
         * Used to stop recording state changes before an ad break begins.
         * @returns {Api} The Player API instance.
         * @deprecated
         */
        detachMedia() {
            core.detachMedia();
            return this;
        },

        /**
         * Checks if the player has finished playing the current playlist item,
         * but has not yet triggered the "complete" event or began the next item.
         * This state is entered when playing postroll ads.
         * @returns {boolean} Is the "beforeComplete" event being propagated or interrupted by instream?
         */
        isBeforeComplete() {
            return core.isBeforeComplete();
        },

        /**
         * Checks if playback has been requested, but not yet attempted.
         * This state is entered when playing preroll ads.
         * @returns {boolean} Is the "beforePlay" event being propagated or interrupted by instream?
         */
        isBeforePlay() {
            return core.isBeforePlay();
        },

        /**
         * Registers an async playlist item callback. Only one can be set. Replaces previously set callback.
         *
         * When the callback returns a promise, playlist progression will be blocked until the promise is resolved.
         * If the promise resolves with a valid playlist object, that object will replace the item in the playlist.
         *
         * @param {function} callback - A callback run in advance of the
         * "playlistItem" event depending on the callback context.
         *
         * `(item, index) => Promise<Item|undefined>|undefined`
         *
         * The callback accepts several arguments:
         *    item - the playlist item
         *    index - the playlist items index in the playlist
         *
         * The callback may be executed in advance of the current playlist item completing. This is to allow preloading
         * of the next item and pre-rolls to be blocked.
         *
         * @param {Object} [options] - Reserved for future use.
         * @returns {void}
         */
        setPlaylistItemCallback(callback, options) {
            core.setItemCallback(callback, options);
        },

        /**
         * Removes the async playlist item callback.
         * @returns {void}
         */
        removePlaylistItemCallback() {
            core.setItemCallback(null);
        },

        /**
         * Gets the async blocking Promise for the next playlist item, or a specific playlist item if the
         * index argument is supplied.
         *
         * The Promise returned resolves when the async item callback resolves for the
         * playlist item. If there is no callback, or the callback promise resolved immediately, this promise can
         * resolve in advance of the previous playlist item completing, to allow time for preloading media and
         * any scheduled pre-rolls.
         *
         * The Promise will throw if the async item callback is rejected.
         *
         * @param {number} index - A valid playlist item index, or -1 for the next recommended item.
         * @returns {Promise<Item>|null} The playlist item promise, or null when index is invalid or setup is incomplete.
         */
        getPlaylistItemPromise(index) {
            return core.getItemPromise(index);
        }
    });
}

Object.assign(Api.prototype, /** @lends Api.prototype */ {

    /**
     * Adds an event listener.
     * @param {string} name - The event name. Passing "all" will bind the callback to all events.
     * @param {function} callback - The event callback.
     * @param {any} [context] - The context to apply to the callback's function invocation.
     * @return {Api} The Player API instance.
     */
    on(name, callback, context) {
        return on.call(this, name, callback, context);
    },

    /**
     * Adds an event listener which is triggered at most once.
     * The listener is removed after the first call.
     * @param {string} name - The event name. Passing "all" will bind the callback to all events.
     * @param {function} callback - The event callback.
     * @param {any} [context] - The context to apply to the callback's function invocation.
     * @return {Api} The Player API instance.
     */
    once(name, callback, context) {
        return once.call(this, name, callback, context);
    },

    /**
     * Removes one or more callbacks.
     * @param {string} [name] - The event name. If null, all bound callbacks for all events will be removed.
     * @param {function} [callback] - If null, all callbacks for the event will be removed.
     * @param {any} [context] - If null, all callbacks with that function will be removed.
     * @return {Api} The Player API instance.
     */
    off(name, callback, context) {
        return off.call(this, name, callback, context);
    },

    /**
     * Triggers one or more events.
     * By default, the player will invoke callbacks inside a try-catch block to prevent exceptions from breaking normal player behavior.
     * To disable this safety measure set `jwplayer.debug` to `true`.
     * @param {string} name - The event name.
     * @param {object} [args] - An object containing the event properties.
     * @return {Api} The Player API instance.
     */
    trigger(name, args) {
        if (_.isObject(args)) {
            args = Object.assign({}, args);
        } else {
            args = {};
        }
        args.type = name;
        if (ApiSettings.debug) {
            return trigger.call(this, name, args);
        }
        return triggerSafe.call(this, name, args);
    },

    /**
     * Gets the specified plugin instance.
     * @param {string} name - The name of the plugin.
     * @return {any} The plugin instance.
     */
    getPlugin(name) {
        return this.plugins[name];
    },

    /**
     * Adds a plugin instance to the player's instance.
     * @param {string} name - The name of the plugin.
     * @param {any} pluginInstance - The plugin instance.
     * @returns {void}
     */
    addPlugin(name, pluginInstance) {
        this.plugins[name] = pluginInstance;

        this.on('ready', pluginInstance.addToPlayer);

        // A swf plugin may rely on resize events
        if (pluginInstance.resize) {
            this.on('resize', pluginInstance.resizeHandler);
        }
    },

    /**
     * Registers a plugin class with the player library.
     * @param {string} name - The name of the plugin.
     * @param {string} minimumVersion - The minimum player version required by the plugin.
     * @param {function} pluginClass - The plugin function or class to instantiate with new player instances.
     * @returns {void}
     */
    registerPlugin(name, minimumVersion, pluginClass) {
        registerPlugin(name, minimumVersion, pluginClass);
    },

    /**
     * Checks for the presence of an ad blocker. Implemented by jwplayer-commercial.
     * @returns {boolean} Was an ad blocker is detected?
     */
    getAdBlock() {
        return false;
    },

    /**
     * Plays an ad. Implemented by ad plugins.
     * @param {string|Array} adBreak - The ad tag or waterfall array.
     * @returns {void}
     */
    playAd(adBreak) {}, // eslint-disable-line

    /**
     * Pauses or toggles ad playback. Implemented by ad plugins.
     * @param {boolean} toggle - Specifies whether ad playback should be paused or resumed.
     * @returns {void}
     */
    pauseAd(toggle) {}, // eslint-disable-line

    /**
     * Skips the currently playing ad, if skippable. Implemented by ad plugins.
     * @returns {Api} The Player API instance.
     */
    skipAd() {},
});
