import { OS } from 'environment/environment';
import { DISPLAY_CLICK, USER_ACTION, STATE_PAUSED, STATE_PLAYING, STATE_ERROR } from 'events/events';
import Events from 'utils/backbone.events';
import { between } from 'utils/math';
import { addClass, removeClass, toggleClass } from 'utils/dom';
import { now } from 'utils/date';
import button from 'view/controls/components/button';
import Controlbar from 'view/controls/controlbar';
import DisplayContainer from 'view/controls/display-container';
import NextUpTooltip from 'view/controls/nextuptooltip';
import RightClick from 'view/controls/rightclick';
import SettingsMenu from 'view/controls/components/menu/settings-menu.js';
import { getBreakpoint } from 'view/utils/breakpoint';
import { cloneIcon } from 'view/controls/icons';
import ErrorContainer from 'view/error-container';
import instances from 'api/players';
import InfoOverlay from 'view/controls/info-overlay';
import ShortcutsTooltip from 'view/controls/shortcuts-tooltip';
import FloatingCloseButton from 'view/floating-close-button';
import type { Button } from 'view/controls/components/button';
import type { PlayerAPI } from 'types/generic.type';
import type ViewModel from 'view/view-model';

require('css/controls.less');

const ACTIVE_TIMEOUT = OS.mobile ? 4000 : 2000;
// Keys which bypass keyboard shortcuts being off
const ALWAYS_ALLOWED_KEYS = [27];

ErrorContainer.cloneIcon = cloneIcon;
instances.forEach((api: PlayerAPI) => {
    if (api.getState() === STATE_ERROR) {
        const errorIconContainer = api.getContainer().querySelector('.jw-error-msg .jw-icon');
        if (errorIconContainer && !errorIconContainer.hasChildNodes() && ErrorContainer.cloneIcon) {
            errorIconContainer.appendChild(ErrorContainer.cloneIcon('error'));
        }
    }
});

const reasonInteraction = () => {
    return { reason: 'interaction' };
};

interface BaseControls {
    activeTimeout: number;
    backdrop: HTMLElement | null;
    context: HTMLDocument;
    controlbar: Controlbar | null;
    dimensions: {
        cbHeight?: number;
    };
    div: HTMLElement | null;
    inactiveTime: number;
    instreamState: boolean | null;
    keydownCallback: ((evt: Event) => void) | null;
    keyupCallback: ((evt: Event) => void) | null;
    playerContainer: HTMLElement;
    settingsMenu: SettingsMenu | null;
    showing: boolean;
    userInactiveTimeout: () => void;
    wrapperElement: HTMLElement | null;
}

abstract class BaseControls extends Events {
    abstract enable(api: PlayerAPI, model: ViewModel): void;
    abstract disable(model: ViewModel): void;

    resetActiveTimeout(): void {
        clearTimeout(this.activeTimeout);
        this.activeTimeout = -1;
        this.inactiveTime = 0;
    }

    userActive(timeout: number = ACTIVE_TIMEOUT): void {
        if (timeout > 0) {
            this.inactiveTime = now() + timeout;
            if (this.activeTimeout === -1) {
                this.activeTimeout = setTimeout(this.userInactiveTimeout, timeout);
            }
        } else {
            this.resetActiveTimeout();
        }
        if (!this.showing) {
            removeClass(this.playerContainer, 'jw-flag-user-inactive');
            this.showing = true;
            this.trigger('userActive');
        }
    }

    userInactive(): void {
        clearTimeout(this.activeTimeout);
        this.activeTimeout = -1;
        if (this.settingsMenu.visible) {
            return;
        }
        this.inactiveTime = 0;
        this.showing = false;
        addClass(this.playerContainer, 'jw-flag-user-inactive');
        this.trigger('userInactive');
    }

    addControls(): void {
        // Put the controls element inside the wrapper
        if (this.div && this.wrapperElement) {
            this.wrapperElement.appendChild(this.div);
        }
    }

    addBackdrop(): void {
        // Put the backdrop element on top of overlays during instream mode
        // otherwise keep it behind captions and on top of preview poster
        if (this.backdrop && this.wrapperElement) {
            const element = this.instreamState ? this.div : this.wrapperElement.querySelector('.jw-captions');
            this.wrapperElement.insertBefore(this.backdrop, element);
        }
    }

    removeBackdrop(): void {
        if (this.backdrop) {
            const parent = this.backdrop.parentNode;
            if (parent) {
                parent.removeChild(this.backdrop);
            }
        }
    }

    controlbarHeight(): number {
        if (!this.dimensions.cbHeight) {
            this.dimensions.cbHeight = this.controlbar.element().clientHeight as number;
        }
        return this.dimensions.cbHeight;
    }

    element(): HTMLElement | null {
        return this.div;
    }

    resize(): void {
        this.dimensions = {};
    }

    setupInstream(): void {
        this.instreamState = true;
        // Call Controls.userActivity to display the UI temporarily for the start of the ad
        this.userActive();
        this.addBackdrop();
        if (this.settingsMenu) {
            this.settingsMenu.close();
        }
        removeClass(this.playerContainer, 'jw-flag-autostart');
        this.controlbar.elements.time.element().setAttribute('tabindex', '-1');
    }

    destroyInstream(model: ViewModel): void {
        this.instreamState = null;
        this.addBackdrop();
        if (model.get('autostartMuted')) {
            addClass(this.playerContainer, 'jw-flag-autostart');
        }
        this.controlbar.elements.time.element().setAttribute('tabindex', '0');
    }
}

interface Controls extends BaseControls {
    blurCallback: ((evt: Event) => void) | null;
    displayContainer: DisplayContainer | null;
    enabled: boolean;
    focusPlayerElement: () => void;
    infoOverlay: InfoOverlay | null;
    logo: HTMLElement | null;
    mute: Button | null;
    muteChangeCallback: ((muteModel: ViewModel, val: boolean) => void) | null;
    nextUpTooltip: NextUpTooltip | null;
    onRemoveShortcutsDescription?: () => void;
    rightClickMenu: RightClick | null;
    shortcutsTooltip: ShortcutsTooltip | null;
    unmuteCallback: (() => void) | null;
}

class Controls extends BaseControls {
    constructor(context: HTMLDocument, playerContainer: HTMLElement) {
        super();
        this.activeTimeout = -1;
        this.inactiveTime = 0;
        this.context = context;
        this.controlbar = null;
        this.displayContainer = null;
        this.backdrop = null;
        this.enabled = true;
        this.instreamState = null;
        this.keydownCallback = null;
        this.keyupCallback = null;
        this.blurCallback = null;
        this.mute = null;
        this.nextUpTooltip = null;
        this.playerContainer = playerContainer;
        this.wrapperElement = playerContainer.querySelector('.jw-wrapper');
        this.rightClickMenu = null;
        this.settingsMenu = null;
        this.shortcutsTooltip = null;
        this.showing = false;
        this.muteChangeCallback = null;
        this.unmuteCallback = null;
        this.logo = null;
        this.div = null;
        this.dimensions = {};
        this.infoOverlay = null;
        this.userInactiveTimeout = () => {
            // Rerun at the scheduled time if remaining time is greater than the display refresh rate
            const remainingTime = this.inactiveTime - now();
            if (this.inactiveTime && remainingTime > 16) {
                this.activeTimeout = setTimeout(this.userInactiveTimeout, remainingTime);
                return;
            }
            if (this.playerContainer.querySelector('.jw-tab-focus')) {
                this.resetActiveTimeout();
                return;
            }
            this.userInactive();
        };
    }

    enable(api: PlayerAPI, model: ViewModel): void {
        const element = this.context.createElement('div');
        element.className = 'jw-controls jw-reset';
        this.div = element;

        const backdrop = this.context.createElement('div');
        backdrop.className = 'jw-controls-backdrop jw-reset';
        this.backdrop = backdrop;

        this.logo = this.playerContainer.querySelector('.jw-logo');

        const touchMode = model.get('touchMode');

        this.focusPlayerElement = () => {
            if (model.get('isFloating')) {
                const videoElement = this.wrapperElement && this.wrapperElement.querySelector('video');
                if (videoElement) {
                    videoElement.focus();
                }
            } else {
                this.playerContainer.focus();
            }
        };

        // Display Buttons
        if (!this.displayContainer) {
            const displayContainer = new DisplayContainer(model, api);

            displayContainer.buttons.display.on('click tap enter', () => {
                this.trigger(DISPLAY_CLICK);
                this.userActive(1000);
                api.playToggle(reasonInteraction());
                this.focusPlayerElement();
            });

            this.div.appendChild(displayContainer.element());
            this.displayContainer = displayContainer;
        }

        // Touch UI mode when we're on mobile and we have a percentage height or we can fit the large UI in
        this.infoOverlay = new InfoOverlay(element, model, api, visible => {
            toggleClass(this.div, 'jw-info-open', visible);
            if (visible) {
                //  Focus modal close button on open
                const modalCloseButton = this.div && this.div.querySelector('.jw-info-close') as HTMLElement;
                if (modalCloseButton) {
                    modalCloseButton.focus();
                }
            } else {
                this.focusPlayerElement();
            }
        });
        //  Add keyboard shortcuts if not on mobile
        if (!OS.mobile && this.wrapperElement) {
            this.shortcutsTooltip = new ShortcutsTooltip(this.wrapperElement, api, model, visible => {
                if (!visible) {
                    this.focusPlayerElement();
                }
            });
        }
        this.rightClickMenu = new RightClick(this.infoOverlay, this.shortcutsTooltip);
        if (touchMode) {
            addClass(this.playerContainer, 'jw-flag-touch');
            this.rightClickMenu.setup(model, this.playerContainer, this.wrapperElement);
        } else {
            model.change('flashBlocked', (modelChanged, isBlocked) => {
                if (isBlocked) {
                    this.rightClickMenu.destroy();
                } else {
                    this.rightClickMenu.setup(modelChanged, this.playerContainer, this.wrapperElement);
                }
            }, this);
        }

        // Floating Close Button
        let floatingConfig = model.get('floating');

        if (floatingConfig) {
            const floatCloseButton = new FloatingCloseButton(element, model.get('localization').close);
            const doNotForward = true;
            floatCloseButton.on(USER_ACTION, () => this.trigger('dismissFloating', { doNotForward }));

            if (floatingConfig.dismissible !== false) {
                addClass(this.playerContainer, 'jw-floating-dismissible');
            }
        }

        // Controlbar
        const controlbar = this.controlbar = new Controlbar(api, model,
            this.playerContainer.querySelector('.jw-hidden-accessibility'));
        controlbar.on(USER_ACTION, () => {
            this.off('userInactive', this.focusPlayerElement, this);
            this.once('userInactive', this.focusPlayerElement, this);
            this.userActive();
        });
        controlbar.on('nextShown', (data) => {
            this.trigger('nextShown', data);
        });
        controlbar.on('adjustVolume', adjustVolume, this);

        // Next Up Tooltip
        if (model.get('nextUpDisplay') && !controlbar.nextUpTooltip) {
            const nextUpTooltip = new NextUpTooltip(model, api, this.playerContainer);
            nextUpTooltip.on('all', this.trigger, this);
            nextUpTooltip.setup(this.context);
            controlbar.nextUpTooltip = nextUpTooltip;

            // NextUp needs to be behind the controlbar to not block other tooltips
            this.div.appendChild(nextUpTooltip.element());
        }

        this.div.appendChild(controlbar.element());

        const localization = model.get('localization');
        const settingsMenu = this.settingsMenu = new SettingsMenu(api, model.player, this.controlbar, localization);
        let lastState = null;

        settingsMenu.on('menuVisibility', ({ visible, evt }) => {
            const state = model.get('state');
            const settingsInteraction = { reason: 'settingsInteraction' };
            const settingsButton = this.controlbar.elements.settingsButton;
            const isKeyEvent = (evt && evt.sourceEvent || evt || {}).type === 'keydown';
            const activeTimeout = (visible || isKeyEvent) ? 0 : ACTIVE_TIMEOUT;
            // Trigger userActive so that a dismissive click outside the player can hide the controlbar
            this.userActive(activeTimeout);
            if (getBreakpoint(model.get('containerWidth')) < 2) {
                if (visible && state === STATE_PLAYING) {
                    // Pause playback on open if we're currently playing
                    api.pause(settingsInteraction);
                } else if (!visible && state === STATE_PAUSED && lastState === STATE_PLAYING) {
                    // Resume playback on close if we are paused and were playing before
                    api.play(settingsInteraction);
                }
            }
            lastState = state;
            if (!visible && isKeyEvent && settingsButton) {
                settingsButton.element().focus();
            } else if (evt) {
                this.focusPlayerElement();
            }
        });
        settingsMenu.on('captionStylesOpened', () => this.trigger('captionStylesOpened'));
        controlbar.on('settingsInteraction', (submenuName, isDefault, event) => {
            if (isDefault) {
                return settingsMenu.defaultChild.toggle(event, true);
            }
            settingsMenu.children[submenuName].toggle(event);
        });

        if (OS.mobile) {
            this.div.appendChild(settingsMenu.el);
        } else {
            this.playerContainer.setAttribute('aria-describedby', 'jw-shortcuts-tooltip-explanation');
            this.div.insertBefore(settingsMenu.el, controlbar.element());
        }

        // Unmute Autoplay behavior.
        const setupUnmuteAutoplay = (_model) => {
            if (_model.get('autostartMuted')) {
                const unmuteCallback = () => this.unmuteAutoplay(api, _model);
                const muteChangeCallback = (muteModel: ViewModel, val: boolean) => {
                    if (!val) {
                        unmuteCallback();
                    }
                };

                // Show unmute botton only on mobile.
                if (OS.mobile) {
                    this.mute = button('jw-autostart-mute jw-off', unmuteCallback, _model.get('localization').unmute,
                        [cloneIcon('volume-0')]);
                    this.mute.show();
                    if (this.div) {
                        this.div.appendChild(this.mute.element());
                    }
                }

                // Set mute state in the controlbar
                controlbar.renderVolume(true, _model.get('volume'));
                // Hide the controlbar until the autostart flag is removed
                addClass(this.playerContainer, 'jw-flag-autostart');

                _model.on('change:autostartFailed', unmuteCallback, this);
                _model.on('change:autostartMuted change:mute', muteChangeCallback, this);
                this.muteChangeCallback = muteChangeCallback;
                this.unmuteCallback = unmuteCallback;
            }
        };
        model.once('change:autostartMuted', setupUnmuteAutoplay);
        setupUnmuteAutoplay(model);

        // Keyboard Commands
        function adjustSeek(amount: number): void {
            let min = 0;
            let max = model.get('duration');
            const position = model.get('position');
            if (model.get('streamType') === 'DVR') {
                const dvrSeekLimit = model.get('dvrSeekLimit');
                min = max;
                max = Math.max(position, -dvrSeekLimit);
            }
            const newSeek = between(position + amount, min, max);
            api.seek(newSeek, reasonInteraction());
        }

        function adjustVolume(amount: number): void {
            const newVol = between(model.get('volume') + amount, 0, 100);
            api.setVolume(newVol);
        }

        const handleKeydown = (evt: KeyboardEvent) => {
            // If Meta keys return
            if (evt.ctrlKey || evt.metaKey) {
                // Let event bubble upwards
                return true;
            }
            const menuHidden = !this.settingsMenu.visible;
            const shortcutsEnabled = model.get('enableShortcuts') === true;
            const adMode = this.instreamState;

            if (!shortcutsEnabled && ALWAYS_ALLOWED_KEYS.indexOf(evt.keyCode) === -1) {
                return;
            }

            switch (evt.keyCode) {
                case 27: // Esc
                    if (model.get('fullscreen')) {
                        api.setFullscreen(false);
                        this.playerContainer.blur();
                        this.userInactive();
                    } else {
                        const related = api.getPlugin('related');
                        if (related) {
                            related.close({ type: 'escape' });
                        }
                    }
                    //  Close all modals on esc press.
                    if (this.rightClickMenu.el) {
                        this.rightClickMenu.hideMenuHandler();
                    }
                    if (this.infoOverlay.visible) {
                        this.infoOverlay.close();
                    }
                    if (this.shortcutsTooltip) {
                        this.shortcutsTooltip.close();

                    }
                    break;
                case 13: // enter
                case 32: // space
                    if (document.activeElement &&
                        document.activeElement.classList.contains('jw-switch') &&
                        evt.keyCode === 13) {
                        // Let event bubble up so the spacebar can control the toggle if focused on
                        return true;
                    }
                    api.playToggle(reasonInteraction());
                    break;
                case 37: // left-arrow, if shortcuts are enabled, not adMode, and settings menu is hidden
                    if (!adMode && menuHidden) {
                        adjustSeek(-5);
                    }
                    break;
                case 39: // right-arrow, if shortcuts are enabled, not adMode, and settings menu is hidden
                    if (!adMode && menuHidden) {
                        adjustSeek(5);
                    }
                    break;
                case 38: // up-arrow, if shortcuts are enabled and settings menu is hidden
                    if (menuHidden) {
                        adjustVolume(10);
                    }
                    break;
                case 40: // down-arrow, if shortcuts are enabled and settings menu is hidden
                    if (menuHidden) {
                        adjustVolume(-10);
                    }
                    break;
                case 67: {
                    // c-key, if shortcuts are enabled
                    const captionsList = api.getCaptionsList();
                    const listLength = captionsList.length;
                    if (listLength) {
                        const nextIndex = (api.getCurrentCaptions() + 1) % listLength;
                        api.setCurrentCaptions(nextIndex);
                    }
                    break;
                }
                case 77: // m-key, if shortcuts are enabled
                    api.setMute();
                    break;
                case 70: // f-key, if shortcuts are enabled
                    api.setFullscreen();
                    break;
                case 191: // ? key
                    if (this.shortcutsTooltip) {
                        this.shortcutsTooltip.toggleVisibility();
                    }
                    break;
                default:
                    if (evt.keyCode >= 48 && evt.keyCode <= 59) {
                        // if 0-9 number key, move to n/10 of the percentage of the video
                        const number = evt.keyCode - 48;
                        const newSeek = (number / 10) * model.get('duration');
                        api.seek(newSeek, reasonInteraction());
                    }
            }

            if (/13|32|37|38|39|40/.test(evt.keyCode.toString())) {
                // Prevent keypresses from scrolling the screen
                evt.preventDefault();
                return false;
            }
        };
        this.playerContainer.addEventListener('keydown', handleKeydown);
        this.keydownCallback = handleKeydown;

        const handleKeyup = (evt) => {
            switch (evt.keyCode) {
                case 9: {
                    // tab, keep controls active when navigating inside the player
                    const insideContainer = this.playerContainer.contains(evt.target);
                    const activeTimeout = insideContainer ? 0 : ACTIVE_TIMEOUT;
                    this.userActive(activeTimeout);
                    break;
                }
                case 32: // space
                    evt.preventDefault();
                    break;
                default:
                    break;
            }
        };
        this.playerContainer.addEventListener('keyup', handleKeyup);
        this.keyupCallback = handleKeyup;

        // Hide controls when focus leaves the player
        const blurCallback = (evt) => {
            this.off('userInactive', this.focusPlayerElement, this);
            const focusedElement = evt.relatedTarget || document.querySelector(':focus');
            if (!focusedElement) {
                return;
            }
            const insideContainer = this.playerContainer.contains(focusedElement);
            if (!insideContainer) {
                this.userInactive();
            }
        };

        this.playerContainer.addEventListener('blur', blurCallback, true);
        this.blurCallback = blurCallback;

        //  Remove new shortcut tooltip description after first read.
        const onRemoveShortcutsDescription = () => {
            const ariaDescriptionId = this.playerContainer.getAttribute('aria-describedby');
            //  Remove tooltip description after first focus.
            if (ariaDescriptionId === 'jw-shortcuts-tooltip-explanation') {
                this.playerContainer.removeAttribute('aria-describedby');
            }
            this.playerContainer.removeEventListener('blur', onRemoveShortcutsDescription, true);
        };

        if (this.shortcutsTooltip) {
            this.playerContainer.addEventListener('blur', onRemoveShortcutsDescription, true);
            this.onRemoveShortcutsDescription = onRemoveShortcutsDescription;
        }

        // Show controls when enabled
        this.userActive();

        this.addControls();
        this.addBackdrop();

        model.set('controlsEnabled', true);
    }

    disable(model: ViewModel): void {
        const {
            nextUpTooltip,
            settingsMenu,
            infoOverlay,
            controlbar,
            rightClickMenu,
            shortcutsTooltip,
            playerContainer,
            div
        } = this;

        clearTimeout(this.activeTimeout);
        this.activeTimeout = -1;

        this.off();

        model.off(null, null, this);
        model.set('controlsEnabled', false);

        if (div && div.parentNode) {
            removeClass(playerContainer, 'jw-flag-touch');
            div.parentNode.removeChild(div);
        }

        if (controlbar) {
            controlbar.destroy();
        }

        if (rightClickMenu) {
            rightClickMenu.destroy();
        }

        if (this.keydownCallback) {
            playerContainer.removeEventListener('keydown', this.keydownCallback);
        }

        if (this.keyupCallback) {
            playerContainer.removeEventListener('keyup', this.keyupCallback);
        }

        if (this.blurCallback) {
            playerContainer.removeEventListener('blur', this.blurCallback);
        }

        if (this.onRemoveShortcutsDescription) {
            playerContainer.removeEventListener('blur', this.onRemoveShortcutsDescription);
        }

        if (this.displayContainer) {
            this.displayContainer.destroy();
        }

        if (nextUpTooltip) {
            nextUpTooltip.destroy();
        }

        if (settingsMenu) {
            settingsMenu.destroy();
        }

        if (infoOverlay) {
            infoOverlay.destroy();
        }

        if (shortcutsTooltip) {
            shortcutsTooltip.destroy();
        }

        this.removeBackdrop();
    }

    unmuteAutoplay(api: PlayerAPI, model: ViewModel): void {
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
        if (this.muteChangeCallback) {
            model.off('change:autostartMuted change:mute', this.muteChangeCallback);
            this.muteChangeCallback = null;
        }
        if (this.unmuteCallback) {
            model.off('change:autostartFailed', this.unmuteCallback);
            this.unmuteCallback = null;
        }
        model.set('autostartFailed', undefined);
        model.set('autostartMuted', undefined);
        api.setMute(mute);
        // the model's mute value may not have changed. ensure the controlbar's mute button is in the right state
        this.controlbar.renderVolume(mute, model.get('volume'));
        if (this.mute) {
            this.mute.hide();
        }

        removeClass(this.playerContainer, 'jw-flag-autostart');
        this.userActive();
    }

    mouseMove(event: MouseEvent): void {
        const insideControlbar = this.controlbar.element().contains(event.target);
        const insideNextUp = this.controlbar.nextUpTooltip &&
            this.controlbar.nextUpTooltip.element().contains(event.target);
        const insideLogo = this.logo && this.logo.contains(event.target as Node);
        const activeTimeout = (insideControlbar || insideNextUp || insideLogo) ? 0 : ACTIVE_TIMEOUT;

        this.userActive(activeTimeout);
    }
}

export { BaseControls };
export default Controls;
