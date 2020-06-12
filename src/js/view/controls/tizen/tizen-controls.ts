import Controls from 'view/controls/controls';
import Controlbar from 'view/controls/controlbar';
import SettingsMenu from 'view/controls/components/menu/settings-menu';
import { addClass } from 'utils/dom';
import { USER_ACTION, STATE_PLAYING, STATE_PAUSED } from 'events/events';
import type { PlayerAPI } from 'types/generic.type';
import type ViewModel from 'view/view-model';
import { getBreakpoint } from 'view/utils/breakpoint';
import { between } from 'utils/math';

const ACTIVE_TIMEOUT = 2000;
const SEEK_SPEEDS = [5, 10, 20];

const reasonInteraction = () => {
    return { reason: 'interaction' };
};

class TizenControls extends Controls {
    seekMode: boolean;
    seekSpeed: number;

    constructor(context: HTMLDocument, playerContainer: HTMLElement) {
        super(context, playerContainer);

        this.seekMode = false;
        this.seekSpeed = SEEK_SPEEDS[0];
    }

    enable(api: PlayerAPI, model: ViewModel): void {
        addClass(this.playerContainer, 'jw-tizen-app');

        /* ---From controls.js--- */
        // Specific for Tizen
        const element = this.context.createElement('div');
        // Classes currently unstyled
        element.className = 'jw-tizen-controls jw-tizen-reset';
        this.div = element;
    
        // Specific backdrop gradient for tizen
        const backdrop = this.context.createElement('div');
        // Classes currently unstyled
        backdrop.className = 'jw-tizen-controls-backdrop jw-tizen-reset';
        this.backdrop = backdrop;

        // Called to focus the player element. (Might not need or might have additional functionality)
        this.focusPlayerElement = () => {
            this.playerContainer.focus();
        };

        // Controlbar
        const controlbar = this.controlbar = new Controlbar(api, model);
        controlbar.on(USER_ACTION, () => {
            this.off('userInactive', this.focusPlayerElement, this);
            this.once('userInactive', this.focusPlayerElement, this);
            this.userActive();
        });

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
        controlbar.on('settingsInteraction', (submenuName: string, isDefault: boolean, event: Event) =>
            settingsMenu.toggle(event)
        );

        this.div.insertBefore(settingsMenu.el, controlbar.element());

        function adjustFastSeek(amount: number): void {
            adjustSeek(amount);
            // If fastForward/Rewind, seek forward/back continuously seek amount
            // If continuous and fastForward again, increment seek speed and continuously seek
            // if fasForward/rewind hold, incrementall increase seek speed until max and keep continous
        }

        function adjustSeek(amount: number): void {
            /*
            If arrow press, seek forward/back lowest seek amount
            If arrow hold, incrementally increase seek speed until max or keyUp
            */

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
        /* ---END: From controls.js--- */

        const focusPlaybackIcon = () => {
            // focus first item in bottom shelf
            var playbackIcon = this.playerContainer.querySelector('jw-icon-playback') as HTMLElement;
            if (playbackIcon) {
                playbackIcon.focus();
            }
        };

        const adsMode = this.instreamState;
        const seekMode = this.seekMode;
        const menuHidden = !this.settingsMenu.visible;

        const handleKeydown = (evt: KeyboardEvent) => {
            switch (evt.keyCode) {
                case 37: // left-arrow
                    /* 
                    if controls showing 
                        if in bottom shelf
                            begin seek
                    
                        if in top shelf
                            select left icon until leftmost
                    */
                    if (!adsMode && !this.showing) {
                        adjustSeek(-this.seekSpeed);
                        this.incrementSeek();
                    }
                    break;
                case 39: // right-arrow
                    /* 
                    if controls showing 
                        if in bottom shelf
                            begin seek
                    
                        if in top shelf
                            select right icon until rightmost
                    */
                    if (!adsMode && !this.showing) {
                        adjustSeek(this.seekSpeed);
                        this.incrementSeek();
                    }
                    break;
                case 38: // up-arrow
                    /* 
                        // handled in menu
                        if menu open
                            scrolls up menu until top
                        
                        // handled by controlbar
                        if play/pause (bottom shelf) in focus
                            highlights back arrow (first item in top shelf)
                    */
                   // show controls if hidden and focus playback
                    if (!this.showing) {
                        this.userActive();
                        focusPlaybackIcon();
                    }

                    if (seekMode) {
                        this.userInactive();
                        api.play();
                    }
                    break;
                case 40: // down-arrow
                    /*  
                        // handled in menu
                        if menu open
                            scrolls down menu until bottom
                        
                        if play/pause (bottom shelf) in focus
                            hides controls

                        // handled by controlbar
                        if menu/back (top shelf) in focus
                            highlights play/pause (first item in bottom shelf)
                    */
                   // show controls if hidden and focus playback
                    if (!this.showing) {
                        this.userActive();
                        focusPlaybackIcon();
                    }

                    // If seeking, stop seek and show controls
                    if (seekMode) {
                        this.userActive();
                        focusPlaybackIcon();
                    }
                    break;
                case 13: // center/enter
                    /* 
                        // Can be handled in controlbar
                        if icon selected
                            execute for that icon
                    */
                   // show controls if hidden and focus playback
                    if (!this.showing) {
                        this.userActive();
                        focusPlaybackIcon();
                    }

                   // cancel seek if seeking (may be in controlbar)
                    if (seekMode) {
                        this.seekMode = false;
                        api.play();
                    }
                    break;
                case 415: // play
                    // Can be handled by menu
                    if (!menuHidden) {
                        // close menu and resume if playing or pause
                        // show controls and activate timeout
                        this.settingsMenu.close();
                        this.userActive();
                        return;
                    }

                   // cancel seek if seeking (may be in controlbar)
                    if (seekMode || model.get('state') === STATE_PAUSED) {
                        this.seekMode = false;
                        api.play();
                    }
                    break;
                case 19: // pause
                    // Can be handled by menu
                    if (!menuHidden) {
                        // close menu and resume if playing or pause
                        // show controls and activate timeout
                        this.settingsMenu.close();
                        this.userActive();
                        return;
                    }

                   // cancel seek if seeking (may be in controlbar)
                    if (seekMode || model.get('state') === STATE_PLAYING) {
                        this.seekMode = false;
                        api.pause();
                    }
                    break;
                case 10252: // play/pause
                    // Can be handled by menu
                    if (!menuHidden) {
                        // close menu and resume if playing or pause
                        // show controls and activate timeout
                        this.settingsMenu.close();
                        this.userActive();
                        return;
                    }

                    // cancel seek if seeking (may be in controlbar)
                    if (seekMode) {
                        this.seekMode = false;
                    }

                    api.playToggle(reasonInteraction());
                    break;
                case 412: // Rewind
                    /* 
                    if menu !open and not adsMode
                        begin back seek
                        if back seeking
                            increase to next seek, if max wrap to first
                    */
                    if (!adsMode && menuHidden) {
                        adjustFastSeek(-this.seekSpeed);
                    }
                    break;
                case 417: // FastForward
                    /* 
                    if menu !open and not adsMode
                        begin seek
                        if front seeking
                            increase to next seek, if max wrap to first
                    */
                    if (!adsMode && menuHidden) {
                        adjustFastSeek(this.seekSpeed);
                    }
                    break;
                case 10009: // Back
                    // Can be handled by menu
                    if (!menuHidden) {
                        // close menu and resume if playing or pause
                        // show controls and activate timeout
                        this.settingsMenu.close();
                        this.userActive();
                        return;
                    }

                    // can be handles by controlBar
                    if (seekMode) {
                        // cancel seek and resume were left off/pause
                        this.seekMode = false;
                        this.userActive();
                        return;
                    }

                    this.trigger('backClick');
                    this.removePlayer(api, model);
                    break;
                case 10182: // Exit/Home
                    this.removePlayer(api, model);
                    break;
                // REVISIT these Long Press Cases - Unsure of their behavior
                // case 10233: // Long FastForward
                //     /* 
                //     if menu !open and not adsMode
                //         periodically increase seek until max seek
                //     */
                //     break;
                // case 10232: // Long Rewind
                //     /* 
                //     if menu !open and not adsMode
                //         periodically increase back seek until max seek
                //     */
                //     break;
                default:
                    break;
            }
        };
        // For the TV to hear events (Might not be needed)
        document.addEventListener('keydown', handleKeydown);
        // For the player to trace callback in controls.js
        this.keydownCallback = handleKeydown;

        const handleKeyup = (evt: KeyboardEvent) => {
            switch (evt.keyCode) {
                case 37: // left-arrow
                case 39: // right-arrow
                    if (this.seekMode) {
                        this.seekSpeed = SEEK_SPEEDS[0];
                    }
                    break;
                default:
                    break;
            }
        };
        // (Might not be needed)
        this.playerContainer.addEventListener('keyup', handleKeyup);
        // For the player to trace callback in controls.js
        this.keyupCallback = handleKeyup;

        /* ---2 From controls.js--- */
        // Show controls when enabled
        this.userActive();

        this.addControls();
        this.addBackdrop();

        model.set('controlsEnabled', true);
        /* ---END 2: From controls.js--- */
    }

    disable(model: ViewModel): void {
        if (this.keydownCallback) {
            document.removeEventListener('keydown', this.keydownCallback);
            this.playerContainer.removeEventListener('keydown', this.keydownCallback);
        }

        super.disable.apply(this, [model]);
    }

    userInactive(): void {
        this.seekMode = false;
        super.disable.apply(this);
    }

    incrementSeek(): void {
        const seekSpeed = this.seekSpeed;
        const maxSpeed = SEEK_SPEEDS[SEEK_SPEEDS.length - 1];

        if (seekSpeed == maxSpeed) {
            return;
        }

        var index = SEEK_SPEEDS.indexOf(seekSpeed);
        var newIndex = index + 1;
        this.seekSpeed = SEEK_SPEEDS[newIndex];
    }

    removePlayer(api: PlayerAPI, model: ViewModel): void {
        this.disable(model);
        api.remove();
    }
}

export default TizenControls;
