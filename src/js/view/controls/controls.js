define([
    'events/events',
    'events/states',
    'utils/backbone.events',
    'utils/constants',
    'utils/helpers',
    'utils/underscore',
    'view/controls/components/button',
    'view/controls/controlbar',
    'view/controls/dock',
    'view/controls/display-container',
    'view/controls/rewind-display-icon',
    'view/controls/play-display-icon',
    'view/controls/next-display-icon',
    'view/controls/nextuptooltip',
    'view/controls/rightclick',
], function (events, states, Events, Constants, utils, _, button, Controlbar, Dock,
             DisplayContainer, RewindDisplayIcon, PlayDisplayIcon, NextDisplayIcon,
             NextUpToolTip, RightClick) {

    const ACTIVE_TIMEOUT = utils.isMobile() ? 4000 : 2000;

    const reasonInteraction = function() {
        return { reason: 'interaction' };
    };

    let stylesInjected = false;

    return class Controls {
        constructor(context, playerContainer) {
            _.extend(this, Events);

            // Alphabetic order
            // Any property on the prototype should be initialized here first
            this.activeTimeout = -1;
            this.context = context;
            this.controlbar = null;
            this.displayContainer = null;
            this.dock = null;
            this.enabled = true;
            this.instreamState = null;
            this.keydownCallback = null;
            this.mute = null;
            this.nextUpToolTip = null;
            this.playerContainer = playerContainer;
            this.rightClickMenu = null;
            this.showing = false;
            this.unmuteCallback = null;
            this.div = null;
            this.right = null;
            this.activeListeners = {
                mousemove: () => clearTimeout(this.activeTimeout),
                mouseout: () => this.userActive()
            };
            this.dimensions = {};
            if (!stylesInjected) {
                stylesInjected = true;
                require('css/controls.less');
            }
        }

        enable(api, model) {
            const element = this.context.createElement('div');
            element.className = 'jw-controls jw-reset';
            this.div = element;

            const touchMode = model.get('touchMode');

            // Display Buttons
            if (!this.displayContainer) {
                const displayContainer = new DisplayContainer();
                const rewindDisplayIcon = new RewindDisplayIcon(model, api);
                const playDisplayIcon = new PlayDisplayIcon(model);
                const nextDisplayIcon = new NextDisplayIcon(model, api);

                playDisplayIcon.on('click tap', () => {
                    this.trigger(events.JWPLAYER_DISPLAY_CLICK);
                    this.userActive(1000);
                    api.play(reasonInteraction());
                });

                if (utils.isChrome() && !touchMode) {
                    // On Chrome desktop allow media element to capture all play/pause toggle clicks
                    // This allows swfs to capture clicks on start preventing flash-throttling
                    playDisplayIcon.el.style.pointerEvents = 'none';
                    playDisplayIcon.icon.style.pointerEvents = 'none';
                }

                displayContainer.addButton(rewindDisplayIcon);
                displayContainer.addButton(playDisplayIcon);
                displayContainer.addButton(nextDisplayIcon);

                this.div.appendChild(displayContainer.element());
                this.displayContainer = displayContainer;
            }

            const right = this.context.createElement('div');
            right.className = 'jw-controls-right jw-reset';
            element.appendChild(right);
            this.right = right;

            // Dock Area and Buttons
            const dock = this.dock = new Dock(model);
            this.right.appendChild(dock.element());

            // Touch UI mode when we're on mobile and we have a percentage height or we can fit the large UI in
            if (touchMode) {
                utils.addClass(this.playerContainer, 'jw-flag-touch');
            } else {
                this.rightClickMenu = new RightClick();
                model.change('flashBlocked', (modelChanged, isBlocked) => {
                    if (isBlocked) {
                        this.rightClickMenu.destroy();
                    } else {
                        this.rightClickMenu.setup(modelChanged, this.playerContainer, this.playerContainer);
                    }
                });
            }

            // Controlbar
            const controlbar = this.controlbar = new Controlbar(api, model);
            controlbar.on(events.JWPLAYER_USER_ACTION, () => this.userActive());
            // Next Up Tooltip
            if (model.get('nextUpDisplay') && !controlbar.nextUpToolTip) {
                const nextUpToolTip = new NextUpToolTip(model, api, this.playerContainer);
                nextUpToolTip.on('all', this.trigger, this);
                nextUpToolTip.setup(this.context);
                controlbar.nextUpToolTip = nextUpToolTip;

                // NextUp needs to be behind the controlbar to not block other tooltips
                this.div.appendChild(nextUpToolTip.element());
            }
            this.addActiveListeners(controlbar.element());
            this.div.appendChild(controlbar.element());

            // Unmute Autoplay Button. Ignore iOS9. Muted autoplay is supported in iOS 10+
            if (model.get('autostartMuted')) {
                const unmuteCallback = () => this.unmuteAutoplay(api, model);
                this.mute = button('jw-autostart-mute jw-off', unmuteCallback, model.get('localization').volume);
                this.mute.show();
                this.div.appendChild(this.mute.element());
                // Set mute state in the controlbar
                controlbar.renderVolume(true, model.get('volume'));
                // Hide the controlbar until the autostart flag is removed
                utils.addClass(this.playerContainer, 'jw-flag-autostart');

                model.on('change:autostartFailed change:autostartMuted change:mute', unmuteCallback);
                this.unmuteCallback = unmuteCallback;
            }

            // Keyboard Commands
            function adjustSeek(amount) {
                let min = 0;
                let max = model.get('duration');
                const position = model.get('position');
                if (model.get('streamType') === 'DVR') {
                    min = max;
                    max = Math.max(position, Constants.dvrSeekLimit);
                }
                const newSeek = utils.between(position + amount, min, max);
                api.seek(newSeek, reasonInteraction());
            }
            function adjustVolume(amount) {
                const newVol = utils.between(model.get('volume') + amount, 0, 100);
                api.setVolume(newVol);
            }
            const handleKeydown = (evt) => {
                // If Meta keys return
                if (evt.ctrlKey || evt.metaKey) {
                    // Let event bubble upwards
                    return true;
                }
                // On keypress show the controlbar for a few seconds
                if (!this.instreamState) {
                    this.userActive();
                }
                switch (evt.keyCode) {
                    case 27: // Esc
                        api.setFullscreen(false);
                        break;
                    case 13: // enter
                    case 32: // space
                        api.play(reasonInteraction());
                        break;
                    case 37: // left-arrow, if not adMode
                        if (!this.instreamState) {
                            adjustSeek(-5);
                        }
                        break;
                    case 39: // right-arrow, if not adMode
                        if (!this.instreamState) {
                            adjustSeek(5);
                        }
                        break;
                    case 38: // up-arrow
                        adjustVolume(10);
                        break;
                    case 40: // down-arrow
                        adjustVolume(-10);
                        break;
                    case 67: // c-key
                        {
                            const captionsList = api.getCaptionsList();
                            const listLength = captionsList.length;
                            if (listLength) {
                                const nextIndex = (api.getCurrentCaptions() + 1) % listLength;
                                api.setCurrentCaptions(nextIndex);
                            }
                        }
                        break;
                    case 77: // m-key
                        api.setMute();
                        break;
                    case 70: // f-key
                        api.setFullscreen();
                        break;
                    default:
                        if (evt.keyCode >= 48 && evt.keyCode <= 59) {
                            // if 0-9 number key, move to n/10 of the percentage of the video
                            const number = evt.keyCode - 48;
                            const newSeek = (number / 10) * model.get('duration');
                            api.seek(newSeek, reasonInteraction());
                        }
                }

                if (/13|32|37|38|39|40/.test(evt.keyCode)) {
                    // Prevent keypresses from scrolling the screen
                    evt.preventDefault();
                    return false;
                }
            };
            this.playerContainer.addEventListener('keydown', handleKeydown);
            this.keydownCallback = handleKeydown;

            // Show controls when enabled
            this.userActive();

            this.playerContainer.appendChild(this.div);
        }

        disable() {
            this.off();
            clearTimeout(this.activeTimeout);

            if (this.div.parentNode) {
                utils.removeClass(this.playerContainer, 'jw-flag-touch');
                this.playerContainer.removeChild(this.div);
            }
            if (this.controlbar) {
                this.removeActiveListeners(this.controlbar.element());
            }
            if (this.rightClickMenu) {
                this.rightClickMenu.destroy();
            }

            if (this.keydownCallback) {
                this.playerContainer.removeEventListener('keydown', this.keydownCallback);
            }

            const nextUpToolTip = this.nextUpToolTip;
            if (nextUpToolTip) {
                nextUpToolTip.destroy();
            }
        }

        controlbarHeight() {
            if (!this.dimensions.cbHeight) {
                this.dimensions.cbHeight = this.controlbar.element().clientHeight;
            }
            return this.dimensions.cbHeight;
        }

        element() {
            return this.div;
        }

        logoContainer() {
            return this.right;
        }

        resize() {
            this.dimensions = {};
        }

        unmuteAutoplay(api, model) {
            const autostartSucceeded = !model.get('autostartFailed');
            let mute = model.get('mute');

            // If autostart succeeded, it means the user has chosen to unmute the video,
            // so we should update the model, setting mute to false
            if (autostartSucceeded) {
                mute = false;
            } else {
                // Don't try to play again when viewable since it will keep failing
                model.set('playOnViewable', false);
            }
            if (this.unmuteCallback) {
                model.off('change:autostartFailed change:autostartMuted change:mute', this.unmuteCallback);
                this.unmuteCallback = null;
            }
            model.set('autostartFailed', undefined);
            model.set('autostartMuted', undefined);
            api.setMute(mute);
            // the model's mute value may not have changed. ensure the controlbar's mute button is in the right state
            this.controlbar.renderVolume(mute, model.get('volume'));
            this.mute.hide();
            utils.removeClass(this.playerContainer, 'jw-flag-autostart');
        }

        addActiveListeners(element) {
            if (element && !utils.isMobile()) {
                element.addEventListener('mousemove', this.activeListeners.mousemove);
                element.addEventListener('mouseout', this.activeListeners.mouseout);
            }
        }

        removeActiveListeners(element) {
            if (element) {
                element.removeEventListener('mousemove', this.activeListeners.mousemove);
                element.removeEventListener('mouseout', this.activeListeners.mouseout);
            }
        }

        userActive(timeout) {
            clearTimeout(this.activeTimeout);
            this.activeTimeout = setTimeout(() => this.userInactive(),
                timeout || ACTIVE_TIMEOUT);
            if (!this.showing) {
                utils.removeClass(this.playerContainer, 'jw-flag-user-inactive');
                this.showing = true;
                this.trigger('userActive');
            }
        }

        userInactive() {
            clearTimeout(this.activeTimeout);
            this.showing = false;
            if (this.controlbar) {
                this.controlbar.closeMenus({
                    type: 'userInactive'
                });
            }
            utils.addClass(this.playerContainer, 'jw-flag-user-inactive');
            this.trigger('userInactive');
        }
    };
});
