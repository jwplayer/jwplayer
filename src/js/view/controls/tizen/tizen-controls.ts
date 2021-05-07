import Title from 'view/title';
import TizenControlbar from 'view/controls/tizen/tizen-controlbar';
import TizenSeekbar from './tizen-seekbar';
import DisplayContainer from 'view/controls/display-container';
import PauseDisplayTemplate from 'view/controls/tizen/templates/pause-display';
import { TizenMenu } from 'view/controls/components/menu/tizen-menu.js';
import { addClass, removeClass, createElement } from 'utils/dom';
import { STATE_PLAYING, STATE_PAUSED, USER_ACTION } from 'events/events';
import Controls from 'view/controls/controls';
import type ViewModel from 'view/view-model';
import type { PlayerAPI } from 'types/generic.type';

require('css/tizen.less');

const ACTIVE_TIMEOUT = 5000;

const reasonInteraction = () => {
    return { reason: 'interaction' };
};

function createBufferIcon(context: HTMLDocument, displayContainer: DisplayContainer, className: string): void {
    const circle = context.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('class', className);
    circle.setAttribute('cx', '50%');
    circle.setAttribute('cy', '50%');
    circle.setAttribute('r', '75');

    const svgContainer = displayContainer.element().querySelector('.jw-svg-icon-buffer');
    if (svgContainer) {
        svgContainer.appendChild(circle);
    }
}

class TizenControls extends Controls {
    context: HTMLDocument;
    playerContainer: HTMLElement;
    api: PlayerAPI | null;
    model: ViewModel | null;
    div: HTMLElement | null;
    backdrop: HTMLElement | null;
    pauseDisplay: HTMLElement | null;
    displayContainer: DisplayContainer | null;
    controlbar: TizenControlbar | null;
    seekbar: TizenSeekbar | null;
    seekState: boolean;
    settingsMenu: TizenMenu | null;
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
        this.api = null;
        this.model = null;
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

    get apiEnabled(): boolean {
        return !!this.api;
    }

    enable(api: PlayerAPI, model: ViewModel): void {
        addClass(this.playerContainer, 'jw-tizen-app jw-flag-fullscreen');
        this.api = api;
        this.model = model;

        const element = this.context.createElement('div');
        element.className = 'jw-tizen-controls jw-tizen-reset';

        // Pause Display
        if (!this.pauseDisplay) {
            const pauseDisplay = createElement(PauseDisplayTemplate());
            const title = new Title(model);
            title.setup(pauseDisplay.querySelector('.jw-pause-display-container'));
            element.appendChild(pauseDisplay);
            this.pauseDisplay = pauseDisplay;
        }

        // Display Buttons - Buffering
        if (!this.displayContainer) {
            const displayContainer = new DisplayContainer(model, api);
            createBufferIcon(this.context, displayContainer, 'jw-tizen-buffer-draw');
            createBufferIcon(this.context, displayContainer, 'jw-tizen-buffer-erase');

            element.appendChild(displayContainer.element());
            this.displayContainer = displayContainer;
        }

        // Controlbar
        const controlbar = new TizenControlbar(api, model,
            this.playerContainer.querySelector('.jw-hidden-accessibility'));
        controlbar.on('backClick', this.onBackClick, this);
        element.appendChild(controlbar.element());

        // Seekbar
        const seekbar = this.seekbar = new TizenSeekbar(model, api, controlbar.elements.time);
        element.appendChild(seekbar.element());

        // Settings/Tracks Menu
        const localization = model.get('localization');
        const settingsMenu = new TizenMenu(api, model.player, this.controlbar, localization);
        settingsMenu.on(USER_ACTION, () => this.userActive());
        controlbar.on('settingsInteraction', () => {
            settingsMenu.toggle();
            const activeButton = this.div && this.div.querySelector('.jw-active');
            if (settingsMenu.visible && activeButton) {
                removeClass(activeButton, 'jw-active');
            }
        });
        element.insertBefore(settingsMenu.el, controlbar.element());

        // Trigger backClick when all videos complete      
        api.on('playlistComplete', this.onBackClick, this);

        // Remove event listener added in base controls
        if (this.keydownCallback) {
            this.playerContainer.removeEventListener('keydown', this.keydownCallback);
            this.keydownCallback = null;
        }

        // For the TV app to hear events
        this.keydownCallback = (evt) => this.handleKeydown(evt);
        document.addEventListener('keydown', this.keydownCallback);

        // To enable features like the ad skip button
        super.enable.call(this, api, model);

        // Next Up Tooltip
        const baseControlbar = this.controlbar;
        if (baseControlbar) {
            const nextUpToolTip = baseControlbar.nextUpToolTip;

            if (nextUpToolTip) {
                nextUpToolTip.off('all');

                if (model.get('nextUp')) {
                    nextUpToolTip.onNextUp(model, model.get('nextUp'));
                }

                baseControlbar.nextUpToolTip = null;
                controlbar.nextUpToolTip = nextUpToolTip;
                element.appendChild(nextUpToolTip.element());
            }

            // Destroy the controlbar being overridden
            baseControlbar.destroy();
        }

        // Destroy the settings menu being overridden
        if (this.settingsMenu) {
            this.settingsMenu.destroy();
        }

        this.settingsMenu = settingsMenu;
        this.controlbar = controlbar;
        this.div = element;

        this.addBackdrop();
        this.addControls();
        this.playerContainer.focus({ preventScroll: true });

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
        this.model = null;

        if (this.apiEnabled) {
            this.api.off(null, null, this);
            this.api = null;
        }

        if (this.keydownCallback) {
            document.removeEventListener('keydown', this.keydownCallback);
        }

        if (this.seekbar) {
            this.seekbar.destroy();
        }

        super.disable.call(this, model);
    }

    userActive(timeout: number = ACTIVE_TIMEOUT): void {
        super.userActive.call(this, timeout);
    }

    onBackClick(): void {
        this.api.trigger('backClick');
        this.api.remove();
    }

    private handleKeydown(evt: KeyboardEvent): void {
        if (!this.apiEnabled || !this.model) {
            return;
        }

        let playButtonActive = false;
        const settingsMenu = this.settingsMenu;
        if (settingsMenu && settingsMenu.visible && evt.keyCode !== 10253) {
            return;
        }
        if (this.controlbar) {
            this.controlbar.handleKeydown(evt, this.showing, this.instreamState);
            playButtonActive = this.controlbar.activeButton === this.controlbar.elements.play;
        }

        switch (evt.keyCode) {
            case 37: // left-arrow
                if (this.instreamState) {
                    this.userActive();
                    return;
                }

                if (this.seekState) {
                    this.updateSeek(-10);
                    return;
                }

                if (!this.showing || playButtonActive) {
                    this.enterSeekMode();
                    return;
                }

                this.userActive();
                break;
            case 39: // right-arrow
                if (this.instreamState) {
                    this.userActive();
                    return;
                }

                if (this.seekState) {
                    this.updateSeek(10);
                    return;
                }

                if (!this.showing || playButtonActive) {
                    this.enterSeekMode();
                    return;
                }

                this.userActive();
                break;
            case 38: // up-arrow
                if (this.seekState) {
                    this.exitSeekMode();
                    this.userInactive();
                    this.api.play();
                    return;
                }
                this.userActive();
                break;
            case 40: // down-arrow
                if (this.seekState) {
                    this.exitSeekMode();
                }
                this.userActive();
                break;
            case 13: // center/enter
                evt.preventDefault();
                if (this.seekState) {
                    this.seek();
                    return;
                }
                if (!this.showing) {
                    this.userActive();
                    this.api.playToggle(reasonInteraction());
                }
                break;
            case 415: // play
                if (this.seekState) {
                    this.seek();
                    return;
                }
                if (this.model.get('state') !== STATE_PLAYING) {
                    this.api.play();
                }
                break;
            case 19: // pause
                if (this.seekState) {
                    this.exitSeekMode();
                    return;
                }
                if (this.model.get('state') !== STATE_PAUSED) {
                    this.userActive();
                    this.api.pause();
                }
                break;
            case 10252: // play/pause
                if (this.seekState) {
                    this.seek();
                    return;
                }
                if (this.model.get('state') !== STATE_PAUSED) {
                    this.userActive();
                }
                this.api.playToggle(reasonInteraction());
                break;
            case 412: // Rewind
                break;
            case 417: // FastForward
                break;
            case 10009: // Back
                if (this.seekState) {
                    this.exitSeekMode();
                    this.userActive();
                    return;
                }
                this.onBackClick();
                break;
            case 10253: // menu
                this.userActive();
                if (settingsMenu) {
                    settingsMenu.toggle(evt);
                }
                break;
            case 10182: // Exit/Home
                this.api.remove();
                break;
            default:
                break;
        }
    }

    private seek(): void {
        if (!this.apiEnabled || !this.seekbar) {
            return;
        }

        this.seekbar.seek();
        this.exitSeekMode();
        this.api.play();
        this.userInactive();
    }

    private enterSeekMode(): void {
        if (!this.apiEnabled || !this.seekbar) {
            return;
        }

        addClass(this.playerContainer, 'jw-flag-seek');
        this.seekState = true;
        this.seekbar.show();
        this.api.pause();
        this.userActive();
    }

    private exitSeekMode(): void {
        if (!this.seekbar) {
            return;
        }

        removeClass(this.playerContainer, 'jw-flag-seek');
        this.seekState = false;
        this.seekbar.hide();
    }

    private updateSeek(increment: number): void {
        if (!this.seekbar) {
            return;
        }
        this.seekbar.update(increment);
        this.userActive();
    }
}

export default TizenControls;
