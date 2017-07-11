import instances from 'api/players';

define([
    'api/timer',
    'controller/controller',
    'plugins/plugins',
    'events/events',
    'events/states',
    'utils/backbone.events',
    'utils/helpers',
    'utils/underscore',
    'version'
], function(Timer, Controller, plugins,
            events, states, Events, utils, _, version) {

    let instancesCreated = 0;

    /**
     * Factory method which creates controllers before calling `jwplayer().setup()`.
     * @param {Api} api
     * @param {HTMLElement} element
     */
    function setupController(api, element) {
        const controller = new Controller(element);

        // capture the ready event and add setup time to it
        controller.on(events.JWPLAYER_READY, (event) => {
            api._qoe.tick('ready');
            event.setupTime = api._qoe.between('setup', 'ready');
        });
        controller.on('all', (type, event) => {
            api.trigger(type, event);
        });

        return controller;
    }

    /**
     * Detaches Api event listeners and destroys the controller.
     * @param {Api} api
     * @param {Controller} controller
     */
    function resetPlayer(api, controller) {
        api.off();
        controller.off();
        // so players can be removed before loading completes
        if (controller.playerDestroy) {
            controller.playerDestroy();
        }
    }

    /**
     * Removes the Api instance from the list of active players.
     * The instance will no longer be queryable via `jwplayer()`
     * @param {Api} api
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
    const Api = function(element) {
        // Add read-only properties which access privately scoped data
        // TODO: The alternative to pass this to the controller/model and access it from there
        const uniqueId = instancesCreated++;
        const playerId = element.id;
        const qoeTimer = new Timer();
        const pluginsMap = {};

        let _controller = setupController(this, element);

        qoeTimer.tick('init');

        Object.defineProperties(this, /** @lends Api.prototype */ {
            /**
             * The player's query id.
             * This matches the id of the element used to create the player at the time is was setup.
             * @type string
             * @readonly
             */
            id: {
                get: function() {
                    return playerId;
                }
            },
            /**
             * The player's unique id.
             * @type number
             * @readonly
             */
            uniqueId: {
                get: function() {
                    return uniqueId;
                }
            },
            /**
             * A map of plugin instances.
             * @type object
             * @readonly
             */
            plugins: {
                get: function() {
                    return pluginsMap;
                }
            },
            /**
             * The internal QoE Timer.
             * @type Timer
             * @readonly
             */
            _qoe: {
                get: function() {
                    return qoeTimer;
                }
            },

            /**
             * @return {string} The player API version.
             * @type string
             * @readonly
             */
            version: {
                get: function() {
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
                get: function() {
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
                get: function() {
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
                get: function() {
                    return _;
                }
            },

        });

        _.extend(this, /** @lends Api.prototype */ {
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
             * @returns {Api}
             */
            setup(options) {
                qoeTimer.clear('ready');
                qoeTimer.tick('setup');

                resetPlayer(this, _controller);
                _controller = setupController(this, element);

                // bind event listeners passed in to the config
                utils.foreach(options.events, (evt, val) => {
                    // TODO: if 'evt' starts with 'on' convert to event name and register event with `on` method
                    const fn = this[evt];
                    if (typeof fn === 'function') {
                        fn.call(this, val);
                    }
                });

                options.id = playerId;
                _controller.setup(options, this);

                return this;
            },

            /** Asynchronously removes the player from the page.
             * A "remove" event is fired once removal begins.
             * Playback is stopped, and the DOM used by the player is reset.
             * All event listeners attached to the player are removed.
             * @returns {Api}
             */
            remove() {
                // Remove from array of players
                removePlayer(this);

                // TODO: [EDIT] This should be fired after `resetPlayer`. Why is it fired before?
                // terminate state
                this.trigger('remove');

                // Unbind listeners and destroy controller/model/...
                resetPlayer(this, _controller);

                return this;
            },

            /**
             * Gets the QoE properties of the player and current playlist item.
             * @returns {PlayerQoE}
             */
            qoe() {
                const qoeItem = _controller.getItemQoe();

                const setupTime = this._qoe.between('setup', 'ready');
                const firstFrame = qoeItem.getFirstFrame();

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
             * Gets the list of available audio tracks.
             * @returns {Array.<AudioTrackOption>}
             */
            getAudioTracks() {
                return _controller.getAudioTracks();
            },

            /**
             * Gets the percentage of the media's duration which has been buffered.
             * @returns {number} A number from 0-100 indicating the percentage of media buffered.
             */
            getBuffer() {
                return _controller.get('buffer');
            },

            /**
             * Gets the captions style.
             * @returns {object}
             */
            getCaptions() {
                return _controller.get('captions');
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
             * @returns {Array.<CaptionsTrackOption>}
             */
            getCaptionsList() {
                return _controller.getCaptionsList();
            },

            /**
             * Gets a static representation of the player's model.
             * @returns {object}
             */
            getConfig() {
                return _controller.getConfig();
            },

            /**
             * Gets the player's top level DOM element.
             * @returns {HTMLElement}
             */
            getContainer() {
                return _controller.getContainer();
            },

            /**
             * Gets whether or not controls are enabled.
             * @returns {boolean}
             */
            getControls() {
                return _controller.get('controls');
            },

            /**
             * Gets the index of the active audio track.
             * @returns {number} The index of the active audio track, or -1 if there are no alternative audio tracks.
             */
            getCurrentAudioTrack() {
                return _controller.getCurrentAudioTrack();
            },

            /**
             * Gets the index of the active captions selection.
             * @returns {number} The index of the active selection option, or 0 if captions are off.
             */
            getCurrentCaptions() {
                return _controller.getCurrentCaptions();
            },

            /**
             * Gets the index of the active quality selection.
             * @returns {number}
             */
            getCurrentQuality() {
                return _controller.getCurrentQuality();
            },

            /**
             * Gets the duration of the current playlist item.
             * @returns {number} The duration in seconds.
             * Live streams always return `Infinity`.
             * DVR streams return a negative value, indicating how far back playback is from the live edge.
             */
            getDuration() {
                return _controller.get('duration');
            },

            /**
             * Gets the player's fullscreen state.
             * @returns {boolean} Whether or not the player is in fullscreen mode.
             */
            getFullscreen() {
                return _controller.get('fullscreen');
            },

            /**
             * Gets the player's height.
             * @returns {number} The height of the player in pixels.
             */
            getHeight() {
                return _controller.getHeight();
            },

            /**
             * Gets all metadata for the current playlist item.
             * @returns {object}
             */
            getItemMeta() {
                return _controller.get('itemMeta') || {};
            },

            /**
             * Gets the player's mute state.
             * @returns {boolean} Whether or not the player is muted.
             */
            getMute() {
                return _controller.getMute();
            },

            /**
             * Gets the rate at which playback should occur while media is playing.
             * @default 1.0
             * @returns {number} The playback rate of the media element (`HTMLMediaElement.playbackRate`).
             * @since v7.12.0
             */
            getPlaybackRate() {
                return _controller.get('playbackRate');
            },

            /**
             * Gets the player's playlist.
             * @returns {Array.<PlaylistItem>}
             */
            getPlaylist() {
                return _controller.get('playlist');
            },

            /**
             * Gets the index of the current playlist item.
             * @returns {number}
             */
            getPlaylistIndex() {
                return _controller.get('item');
            },

            /**
             * Gets the current playlist item, or the item specified by `index`.
             * @param {number} [index] A 0-based index of the desired playlist item.
             * @returns {PlaylistItem|null} Returns `null` when `index` is out of range.
             */
            getPlaylistItem(index) {
                if (!utils.exists(index)) {
                    return _controller.get('playlistItem');
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
                return _controller.get('position');
            },

            /**
             * @typedef {object} ProviderInfo
             * @property {string} name - The name of the Provider handling playback.
             */

            /**
             * Gets information about how the player is handling playback.
             * @returns {ProviderInfo}
             */
            getProvider() {
                return _controller.getProvider();
            },

            /**
             * Gets the list of available quality options.
             * @returns {Array.<QualityOption>}
             */
            getQualityLevels() {
                return _controller.getQualityLevels();
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
             * @returns {SafeRegion}
             */
            getSafeRegion(excludeControlbar = true) {
                return _controller.getSafeRegion(excludeControlbar);
            },

            /**
             * Gets the player state.
             * @returns {'idle'|'buffering'|'playing'|'paused'|'complete'} The current state of the player.
             */
            getState() {
                return _controller.getState();
            },

            /** Gets the mode of stretching used to fit media in the player.
             * @returns {'uniform'|'exactfit'|'fill'|'none'}
             */
            getStretching() {
                return _controller.get('stretching');
            },

            /**
             * Gets the player's viewability.
             * @returns {1|0} Returns `1` when more than half the player is in the document viewport and the page's tab is active.
             * Also returns `1` when the player is in fullscreen mode. `0` otherwise.
             * @since v7.10.0
             */
            getViewable() {
                return _controller.get('viewable');
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
             * @returns {VisualQuality}
             */
            getVisualQuality() {
                return _controller.getVisualQuality();
            },

            /**
             * Gets the player's volume level.
             * @returns {number} A number from 0-100.
             */
            getVolume() {
                return _controller.get('volume');
            },

            /**
             * Gets the player's width.
             * @returns {number} The width of the player in pixels.
             */
            getWidth() {
                return _controller.getWidth();
            },

            /**
             * Sets captions styles.
             * @param {object} captionsStyles
             * @returns {Api}
             * @since v7.5.0
             */
            setCaptions(captionsStyles) {
                _controller.setCaptions(captionsStyles);
                return this;
            },

            /**
             * Updates the player's config options.
             * @param options
             * @returns {Api}
             * @since v7.12.0
             */
            setConfig(options) {
                _controller.setConfig(options);
                return this;
            },

            /**
             * Toggles player controls.
             * @param {boolean} [toggle] - Specifies whether controls should be enabled or disabled.
             * @returns {Api}
             */
            setControls(toggle) {
                _controller.setControls(toggle);
                return this;
            },

            /**
             * Sets the active audio track.
             * @param {number} index
             */
            setCurrentAudioTrack(index) {
                _controller.setCurrentAudioTrack(index);
                // TODO: return this;
            },

            /**
             * Sets the active captions option.
             * @param {number} index
             */
            setCurrentCaptions(index) {
                _controller.setCurrentCaptions(index);
                // TODO: return this;
            },

            /**
             * Sets the active quality option.
             * @param {number} index
             */
            setCurrentQuality(index) {
                _controller.setCurrentQuality(index);
                // TODO: return this;
            },

            /**
             * Toggles fullscreen state. Most browsers require a user gesture to trigger entering fullscreen mode.
             * @param {boolean} [toggle] - Specifies whether to enter or exit fullscreen mode.
             * @returns {Api}
             */
            setFullscreen(toggle) {
                _controller.setFullscreen(toggle);
                return this;
            },

            /**
             * Toggles the player's mute state.
             * @param {boolean} [toggle] - Specifies whether to mute or unmute the player.
             * @returns {Api}
             */
            setMute(toggle) {
                _controller.setMute(toggle);
                return this;
            },

            /**
             * Sets the player's default playeback rate. During playback, the rate of the current media will be set immediately if supported. Not supported when streaming live.
             * @param {number} playbackRate - The desired rate of playback. Limited to numbers between 0.25-4.0.
             * @returns {Api}
             * @since v7.12.0
             */
            setPlaybackRate(playbackRate) {
                _controller.setPlaybackRate(playbackRate);
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
             * @returns {Api}
             */
            setCues(sliderCues) {
                _controller.setCues(sliderCues);
                return this;
            },

            /**
             * Set the player's volume level.
             * @param {number} level - A value from 0-100.
             * @returns {Api}
             */
            setVolume(level) {
                _controller.setVolume(level);
                return this;
            },

            /**
             * Stop any active playback, and loads either a new playlist, a new playlist item,
             * or an item already in the current playlist.
             * @param {string|Array.<PlaylistItem>|PlaylistItem|number} toLoad - The feed url, playlist,
             * playlist item, or playlist item index to load.
             * @param {object} [feedData] - The feed data to associate with playlist items.
             * Only applied when passing in a playlist or playlist items.
             * @returns {Api}
             */
            load(toLoad, feedData) {
                _controller.load(toLoad, feedData);
                return this;
            },

            /**
             * Toggles or un-pauses playback.
             * @param {boolean} [state] - An optional argument that indicates whether to play (true) or pause (false).
             * @param {object} [meta] - An optional argument used to specify cause.
             * @return {Api}
             */
            play(state, meta) {
                if (_.isObject(state) && state.reason) {
                    meta = state;
                }
                if (!meta) {
                    meta = { reason: 'external' };
                }
                if (state === true) {
                    _controller.play(meta);
                    return this;
                } else if (state === false) {
                    _controller.pause(meta);
                    return this;
                }

                state = this.getState();
                switch (state) {
                    case states.PLAYING:
                    case states.BUFFERING:
                        _controller.pause(meta);
                        break;
                    default:
                        _controller.play(meta);
                }

                return this;
            },

            /**
             * Toggles or pauses playback.
             * @param {boolean} [state] - An optional argument that indicates whether to pause (true) or play (false).
             * @param {object} [meta] - An optional argument used to specify cause.
             * @return {Api}
             */
            pause(state, meta) {
                // TODO: meta should no longer be accepted from the base API, it should be passed in to the controller by special wrapped interfaces
                if (_.isBoolean(state)) {
                    return this.play(!state, meta);
                }

                return this.play(meta);
            },

            /**
             * Seeks to a specific time within the active media. Resumes playback if the player is paused.
             * @param {number} position - The time to seek to.
             * @param [meta] - An optional argument used to specify cause.
             * @returns {Api}
             */
            seek(position, meta = { reason: 'external' }) {
                _controller.seek(position, meta);
                return this;
            },

            /**
             * Stops any active playback, and plays the item at the 0-based index in the playlist.
             * @param {number} index - If outside the range of the playlist,
             * the value will be wrapped to the playlist length.
             * @param [meta] - An optional argument used to specify cause.
             * @returns {Api}
             */
            playlistItem(index, meta = { reason: 'external' }) {
                _controller.playlistItem(index, meta);
                return this;
            },

            /**
             * Stops any active playback, and plays the next item in the playlist.
             * When the player is at the end of the playlist, this will play the first playlist item.
             * @param [meta] - An optional argument used to specify cause.
             * @returns {Api}
             */
            playlistNext(meta = { reason: 'external' }) {
                _controller.playlistNext(meta);
                return this;
            },

            /**
             * Stops any active playback, and plays the previous item in the playlist.
             * When the player is at the beginning of the playlist, this will play the last playlist item.
             * @param [meta] - An optional argument used to specify cause.
             * @returns {Api}
             */
            playlistPrev(meta = { reason: 'external' }) {
                _controller.playlistPrev(meta);
                return this;
            },

            /**
             * Stops any active playback, and plays the next up item specified by the related plugin.
             * The next up item is the next playlist item, or the first recommended video when at the end of the playlist.
             * @returns {Api}
             * @since v7.7.0
             */
            next() {
                _controller.next();
                return this;
            },

            /**
             * Toggles the presence of the Airplay button in Safari (calls `HTMLMediaElement.webkitShowPlaybackTargetPicker`).
             * Does not affect the Chromecast button in Chrome.
             * @returns {Api}
             */
            castToggle() {
                _controller.castToggle();
                return this;
            },

            /**
             * Creates a new instance of the instream adapter. If present, the previous instance created is destroyed first.
             * @returns {InstreamAdapter}
             */
            createInstream() {
                return _controller.createInstream();
            },

            /**
             * Calls `skipAd` on the active instream adapter instance if present.
             * @returns {Api}
             */
            skipAd() {
                _controller.skipAd();
                return this;
            },

            /**
             * Stops any active playback.
             * @returns {Api}
             */
            stop() {
                _controller.stop();
                return this;
            },

            /**
             * Sets the player width and height.
             * @param {number|string} width - Set the width in pixel (number) or CSS measurement units ('100%', '100em')
             * @param {number|string} [height] - Set the height in pixel (number) or CSS measurement units ('100%', '100em')
             * When specified, the "aspectratio" option included at setup is cleared.
             * @returns {Api}
             */
            resize(width, height) {
                _controller.resize(width, height);
                return this;
            },

            /** Adds or updates a button in the player's dock. The button is only displayed when controls are active.
             * @param {string} img - An image URL to use as the button icon.
             * @param {string} tooltip - A tooltip label to display when the button is hovered.
             * @param {function} callback - A callback to invoke when the button is clicked.
             * @param {string} id - The id of the button to add or update.
             * @param {string} [btnClass] - CSS classes to add to the button element.
             * @returns {Api}
             */
            addButton(img, tooltip, callback, id, btnClass) {
                _controller.addButton(img, tooltip, callback, id, btnClass);
                return this;
            },

            /**
             * Removes a button from the player's dock.
             * @param {string} id - The id of the button to remove.
             * @returns {Api}
             */
            removeButton(id) {
                _controller.removeButton(id);
                return this;
            },

            /**
             * Reattaches a player instance to it's underlying video tag.
             * Used after ad breaks to record state changes and resume playback.
             * @deprecated TODO: in version 8.0.0-0
             */
            attachMedia() {
                _controller.attachMedia();
                return this;
            },

            /**
             * Detaches a player instance from it's underlying video tag.
             * Used to stop recording state changes before an ad break begins.
             * @deprecated TODO: in version 8.0.0-0
             */
            detachMedia() {
                _controller.detachMedia();
                return this;
            },

            /**
             * Checks if the player has finished playing the current playlist item,
             * but has not yet transitioned to the "complete" state or began the next item.
             * This state is entered when playing postroll ads.
             * @returns {boolean}
             */
            isBeforeComplete() {
                _controller.isBeforeComplete();
            },

            /**
             * Checks if playback has been requested, but the player has not begun to play.
             * This state is entered when playing preroll ads.
             * @returns {boolean}
             */
            isBeforePlay() {
                _controller.isBeforePlay();
            }
        });
    };

    _.extend(Api.prototype, /** @lends Api.prototype */ {

        /**
         * Adds an event listener.
         * @param {string} name - The event name. Passing "all" will bind the callback to all events.
         * @param {function} callback - The event callback.
         * @param {any} [context] - The context to apply to the callback's function invocation.
         * @return {Api}
         */
        on(name, callback, context) {
            return Events.on.call(this, name, callback, context);
        },

        /**
         * Adds an event listener which is triggered at most once.
         * The listener is removed after the first call.
         * @param {string} name - The event name. Passing "all" will bind the callback to all events.
         * @param {function} callback - The event callback.
         * @param {any} [context] - The context to apply to the callback's function invocation.
         * @return {Api}
         */
        once(name, callback, context) {
            return Events.once.call(this, name, callback, context);
        },

        /**
         * Removes one or more callbacks.
         * @param {string} [name] - The event name. If null, all bound callbacks for all events will be removed.
         * @param {function} [callback] - If null, all callbacks for the event will be removed.
         * @param {any} [context] - If null, all callbacks with that function will be removed.
         * @return {Api}
         */
        off(name, callback, context) {
            return Events.off.call(this, name, callback, context);
        },

        /**
         * Triggers one or more events.
         * By default, the player will invoke callbacks inside a try-catch block to prevent exceptions from breaking normal player behavior.
         * To disable this safety measure set `jwplayer.debug` to `true`.
         * @param {string} name - The event name.
         * @param {object} [args] - An object containing the event properties.
         * @return {Api}
         */
        trigger(name, args) {
            if (_.isObject(args)) {
                args = _.extend({}, args);
            } else {
                args = {};
            }
            args.type = name;
            const jwplayer = window.jwplayer;
            if (jwplayer && jwplayer.debug) {
                return Events.trigger.call(this, name, args);
            }
            return Events.triggerSafe.call(this, name, args);
        },

        /**
         * Triggers an event callback inside a try catch block.
         * @deprecated TODO: in version 8.0.0-0
         */
        triggerSafe(type, args) {
            return Events.triggerSafe.call(this, type, args);
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
         * @param {function} [pluginClass2] - (TODO: remove in 8.0.0) When passed in, the previous argument is a path to the flash plugin and this argument is the JS contructor.
         */
        registerPlugin(name, minimumVersion, pluginClass, pluginClass2) {
            plugins.registerPlugin(name, minimumVersion, pluginClass, pluginClass2);
        },

        /**
         * Checks for the presence of an ad blocker. Implemented by jwplayer-commercial.
         * @returns {boolean} - Returns true when an ad blocker is detected, otherwise false.
         */
        getAdBlock() {
            return false;
        },

        /**
         * Plays an ad. Implemented by ad plugins.
         * @param {string|Array} adBreak - The ad tag or waterfall array.
         */
        playAd(/* eslint-disable no-unused-vars */adBreak/* eslint-enable no-unused-vars */) {},

        /**
         * Pauses or toggles ad playback. Implemented by ad plugins.
         * @param {boolean} toggle - Specifies whether ad playback should be paused or resumed.
         */
        pauseAd(/* eslint-disable no-unused-vars */toggle/* eslint-enable no-unused-vars */) {},

        /**
         * @deprecated TODO: in version 8.0.0-0
         */
        dispatchEvent() {
            this.trigger.apply(this, arguments);
        },

        /**
         * @deprecated TODO: in version 8.0.0-0
         */
        removeEventListener() {
            this.off.apply(this, arguments);
        }
    });

    return Api;
});
