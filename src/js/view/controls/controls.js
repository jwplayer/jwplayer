import { OS } from 'environment/environment';
import { dvrSeekLimit } from 'view/constants';
import { DISPLAY_CLICK, USER_ACTION, STATE_PAUSED, STATE_PLAYING } from 'events/events';

import Events from 'utils/backbone.events';
import utils from 'utils/helpers';
import button from 'view/controls/components/button';
import Controlbar from 'view/controls/controlbar';
import DisplayContainer from 'view/controls/display-container';
import NextUpToolTip from 'view/controls/nextuptooltip';
import RightClick from 'view/controls/rightclick';
import { createSettingsMenu, setupSubmenuListeners } from 'view/controls/settings-menu';
import { getBreakpoint } from 'view/utils/breakpoint';

import VOLUME_ICON_0 from 'assets/SVG/volume-0.svg';

require('css/controls.less');

const ACTIVE_TIMEOUT = OS.mobile ? 4000 : 2000;

const reasonInteraction = function() {
    return { reason: 'interaction' };
};

export default class Controls {
    constructor(context, playerContainer) {
        Object.assign(this, Events);

        // Alphabetic order
        // Any property on the prototype should be initialized here first
        this.activeTimeout = -1;
        this.context = context;
        this.controlbar = null;
        this.displayContainer = null;
        this.enabled = true;
        this.instreamState = null;
        this.keydownCallback = null;
        this.mute = null;
        this.nextUpToolTip = null;
        this.playerContainer = playerContainer;
        this.rightClickMenu = null;
        this.settingsMenu = null;
        this.showing = false;
        this.unmuteCallback = null;
        this.div = null;
        this.right = null;
        this.activeListeners = {
            mousemove: () => clearTimeout(this.activeTimeout),
            mouseout: () => this.userActive()
        };
        this.dimensions = {};
    }

    enable(api, model) {
        const element = this.context.createElement('div');
        element.className = 'jw-controls jw-reset';
        this.div = element;

        const touchMode = model.get('touchMode');

        // Display Buttons
        if (!this.displayContainer) {
            const displayContainer = new DisplayContainer(model, api);

            displayContainer.buttons.display.on('click tap', () => {
                this.trigger(DISPLAY_CLICK);
                this.userActive(1000);
                api.play(reasonInteraction());
            });

            this.div.appendChild(displayContainer.element());
            this.displayContainer = displayContainer;
        }

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
            }, this);
        }

        // Controlbar
        const controlbar = this.controlbar = new Controlbar(api, model);
        controlbar.on(USER_ACTION, () => this.userActive());
        controlbar.on('nextShown', function (data) {
            this.trigger('nextShown', data);
        }, this);

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

        // Settings Menu
        let lastState = null;
        const visibilityChangeHandler = (visible) => {
            const state = model.get('state');
            const settingsInteraction = { reason: 'settingsInteraction' };

            utils.toggleClass(this.div, 'jw-settings-open', visible);
            if (getBreakpoint(model.get('containerWidth')) < 2) {
                if (visible && state === STATE_PLAYING) {
                    // Pause playback on open if we're currently playing
                    api.pause(true, settingsInteraction);
                } else if (!visible && state === STATE_PAUSED && lastState === STATE_PLAYING) {
                    // Resume playback on close if we are paused and were playing before
                    api.play(true, settingsInteraction);
                }
            }
            // Trigger userActive so that a dismissive click outside the player can hide the controlbar
            this.userActive();
            lastState = state;
        };
        const settingsMenu = this.settingsMenu = createSettingsMenu(controlbar, visibilityChangeHandler);
        setupSubmenuListeners(settingsMenu, controlbar, model, api);
        this.div.appendChild(settingsMenu.element());

        // Unmute Autoplay Button. Ignore iOS9. Muted autoplay is supported in iOS 10+
        if (model.get('autostartMuted')) {
            const unmuteCallback = () => this.unmuteAutoplay(api, model);
            this.mute = button('jw-autostart-mute jw-off', unmuteCallback, model.get('localization').unmute,
                [VOLUME_ICON_0]);
            this.mute.show();
            this.div.appendChild(this.mute.element());
            // Set mute state in the controlbar
            controlbar.renderVolume(true, model.get('volume'));
            // Hide the controlbar until the autostart flag is removed
            utils.addClass(this.playerContainer, 'jw-flag-autostart');

            model.on('change:autostartFailed change:autostartMuted change:mute', unmuteCallback, this);
            this.unmuteCallback = unmuteCallback;
        }

        // Keyboard Commands
        function adjustSeek(amount) {
            let min = 0;
            let max = model.get('duration');
            const position = model.get('position');
            if (model.get('streamType') === 'DVR') {
                min = max;
                max = Math.max(position, dvrSeekLimit);
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

    disable(model) {
        this.off();

        if (model) {
            model.off(null, null, this);
            const mediaModel = model.get('mediaModel');
            if (mediaModel) {
                mediaModel.off(null, null, this);
            }
        }

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

        const settingsMenu = this.settingsMenu;
        if (settingsMenu) {
            settingsMenu.destroy();
            this.div.removeChild(settingsMenu.element());
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
        if (element && !OS.mobile) {
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
        if (this.settingsMenu.visible) {
            return;
        }

        this.showing = false;
        utils.addClass(this.playerContainer, 'jw-flag-user-inactive');
        this.trigger('userInactive');
    }
}
