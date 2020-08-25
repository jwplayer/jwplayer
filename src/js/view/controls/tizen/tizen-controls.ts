import Title from 'view/title';
import TizenControlbar from 'view/controls/tizen/tizen-controlbar';
import TizenSeekbar from './tizen-seekbar';
import DisplayContainer from 'view/controls/display-container';
import PauseDisplayTemplate from 'view/controls/tizen/templates/pause-display';
import NextUpToolTip from 'view/controls/nextuptooltip';
import SettingsMenu from 'view/controls/components/menu/settings-menu.js';
import { addClass, removeClass, createElement } from 'utils/dom';
import { STATE_PLAYING, STATE_PAUSED } from 'events/events';
import Controls from 'view/controls/controls';
import type ViewModel from 'view/view-model';
import type { PlayerAPI } from 'types/generic.type';

require('css/tizen.less');

const ACTIVE_TIMEOUT = 5000;

const reasonInteraction = () => {
    return { reason: 'interaction' };
};

class TizenControls extends Controls {
    context: HTMLDocument;
    playerContainer: HTMLElement;
    div: HTMLElement | null;
    backdrop: HTMLElement | null;
    pauseDisplay: HTMLElement | null;
    displayContainer: DisplayContainer | null;
    controlbar: TizenControlbar | null;
    seekbar: TizenSeekbar | null;
    seekState: boolean;
    settingsMenu: SettingsMenu | null;
    showing: boolean;
    instreamState: boolean;
    keydownCallback: ((evt: KeyboardEvent) => void) | null;
    userInactive: any;
    wrapperElement: any;
    addBackdrop: any;
    trigger: any;

    constructor(context: HTMLDocument, playerContainer: HTMLElement) {
        super(context, playerContainer);

        this.context = context;
        this.playerContainer = playerContainer;
        this.div = null;
        this.backdrop = null;
        this.pauseDisplay = null;
        this.displayContainer = null;
        this.controlbar = null;
        this.seekbar = null;
        this.seekState = false;
        this.settingsMenu = null;
        this.showing = false;
        this.instreamState = false;
        this.keydownCallback = null;
    }

    enable(api: PlayerAPI, model: ViewModel): void {
        super.enable.call(this, api, model);

        addClass(this.playerContainer, 'jw-tizen-app jw-flag-fullscreen');

        const element = this.context.createElement('div');
        element.className = 'jw-tizen-controls jw-tizen-reset';
        this.div = element;
    
        if (!this.backdrop) {
            const backdrop = this.context.createElement('div');
            backdrop.className = 'jw-controls-backdrop jw-reset';
            this.backdrop = backdrop;
            this.addBackdrop();
        }

        // Pause Display
        if (!this.pauseDisplay) {
            const pauseDisplay = createElement(PauseDisplayTemplate());

            const title = new Title(model);
            title.setup(pauseDisplay.querySelector('.jw-pause-display-container'));
            this.div.appendChild(pauseDisplay);
            this.pauseDisplay = pauseDisplay;
        }

        // Display Buttons - Buffering
        if (!this.displayContainer) {
            const displayContainer = new DisplayContainer(model, api);

            this.div.appendChild(displayContainer.element());
            this.displayContainer = displayContainer;
        }

        // Controlbar
        const controlbar = this.controlbar = new TizenControlbar(api, model,
            this.playerContainer.querySelector('.jw-hidden-accessibility'));
        controlbar.on('backClick', () => {
            this.onBackClick(api);
        });

        // Next Up Tooltip
        if (model.get('nextUpDisplay') && !controlbar.nextUpToolTip) {
            const nextUpToolTip = new NextUpToolTip(model, api, this.playerContainer);
            nextUpToolTip.setup(this.context);
            if (model.get('nextUp')) {
                nextUpToolTip.onNextUp(model, model.get('nextUp'));
            }
            controlbar.nextUpToolTip = nextUpToolTip;

            // NextUp needs to be behind the controlbar to not block other tooltips
            this.div.appendChild(nextUpToolTip.element());
        }

        this.div.appendChild(controlbar.element());

        // Seekbar
        const seekbar = this.seekbar = new TizenSeekbar(model, api, this.controlbar.elements.time);
        this.div.appendChild(seekbar.element());

        const enterSeekMode = () => {
            if (this.seekbar) {
                addClass(this.playerContainer, 'jw-flag-seek');
                this.seekState = true;
                this.seekbar.show();
                api.pause();
            }
        };

        const exitSeekMode = () => {
            if (this.seekbar) {
                removeClass(this.playerContainer, 'jw-flag-seek');
                this.seekState = false;
                this.seekbar.hide();
            }
        };

        const updateSeek = (increment: number) => {
            if (this.seekbar) {
                this.seekbar.update(increment);
            }
        };

        const seek = () => {
            if (this.seekbar) {
                this.seekbar.seek();
                exitSeekMode();
                api.play();
                this.userInactive();
            }
        };

        // Settings/Tracks Menu
        const localization = model.get('localization');
        this.settingsMenu = new SettingsMenu(api, model.player, this.controlbar, localization);

        const handleKeydown = (evt: KeyboardEvent) => {
            if (this.controlbar) {
                this.controlbar.handleKeydown(evt, this.showing, this.instreamState);
            }
            switch (evt.keyCode) {
                case 37: // left-arrow
                    if (this.seekState) {
                        updateSeek(-10);
                    } else if (!this.showing ||
                        (this.controlbar && this.controlbar.activeButton === this.controlbar.elements.play)) {
                        enterSeekMode();
                    }
                    this.userActive();
                    break;
                case 39: // right-arrow
                    if (this.seekState) {
                        updateSeek(10);
                    } else if (!this.showing ||
                        (this.controlbar && this.controlbar.activeButton === this.controlbar.elements.play)) {
                        enterSeekMode();
                    }
                    this.userActive();
                    break;
                case 38: // up-arrow
                    if (this.seekState) {
                        exitSeekMode();
                        this.userInactive();
                        api.play();
                        return;
                    }
                    this.userActive();
                    break;
                case 40: // down-arrow
                    if (this.seekState) {
                        exitSeekMode();
                    }
                    this.userActive();
                    break;
                case 13: // center/enter
                    evt.preventDefault();
                    if (this.seekState) {
                        seek();
                        return;
                    }
                    if (!this.showing) {
                        this.userActive();
                        api.playToggle(reasonInteraction());
                    }
                    break;
                case 415: // play
                    if (this.seekState) {
                        seek();
                        return;
                    }
                    if (model.get('state') !== STATE_PLAYING) {
                        api.play();
                    }
                    break;
                case 19: // pause
                    if (this.seekState) {
                        exitSeekMode();
                        return;
                    }
                    if (model.get('state') !== STATE_PAUSED) {
                        this.userActive();
                        api.pause();
                    }
                    break;
                case 10252: // play/pause
                    if (this.seekState) {
                        seek();
                        return;
                    }
                    if (model.get('state') !== STATE_PAUSED) {
                        this.userActive();
                    }
                    api.playToggle(reasonInteraction());
                    break;
                case 412: // Rewind
                    break;
                case 417: // FastForward
                    break;
                case 10009: // Back
                    if (this.seekState) {
                        exitSeekMode();
                        this.userActive();
                        return;
                    }
                    this.onBackClick(api);
                    break;
                case 10182: // Exit/Home
                    api.remove();
                    break;
                default:
                    break;
            }
        };

        // Trigger backClick when all videos complete      
        api.on('playlistComplete', () => {
            this.onBackClick(api);
        });

        // For the TV app to hear events
        document.addEventListener('keydown', handleKeydown);
        this.keydownCallback = handleKeydown;

        this.addControls();

        // Hide controls on the first frame
        this.userInactive();

        model.set('controlsEnabled', true);
    }

    addControls(): void {
        const controls = this.wrapperElement.querySelector('.jw-controls');
        if (controls) {
            this.wrapperElement.removeChild(controls);
        }
        super.addControls.call(this);
    }

    disable(model: ViewModel): void {
        if (this.keydownCallback) {
            document.removeEventListener('keydown', this.keydownCallback);
        }
        super.disable.call(this, model);
    }

    userActive(timeout: number = ACTIVE_TIMEOUT): void {
        super.userActive.call(this, timeout);
    }

    onBackClick(api: PlayerAPI): void {
        api.trigger('backClick');
        api.remove();
    }
}

export default TizenControls;
