import shortcutTooltipTemplate from 'view/controls/templates/shortcuts-tooltip';
import { createElement, removeClass, addClass, prependChild } from 'utils/dom';
import UI from 'utils/ui';
import button from 'view/controls/components/button';
import { cloneIcon } from 'view/controls/icons';
import { STATE_PLAYING } from 'events/events';
import type { PlayerAPI, StringObject } from 'types/generic.type';
import type ViewModel from 'view/view-model';

type Shortcut = {
    key: string;
    description: string;
}

function getShortcuts(shortcuts: StringObject): Shortcut[] {
    const {
        playPause,
        volumeToggle,
        fullscreenToggle,
        seekPercent,
        increaseVolume,
        decreaseVolume,
        seekForward,
        seekBackward,
        spacebar,
        captionsToggle
    } = shortcuts;

    return [
        {
            key: spacebar,
            description: playPause
        },
        {
            key: '↑',
            description: increaseVolume
        },
        {
            key: '↓',
            description: decreaseVolume
        },
        {
            key: '→',
            description: seekForward
        },
        {
            key: '←',
            description: seekBackward
        },
        {
            key: 'c',
            description: captionsToggle
        },
        {
            key: 'f',
            description: fullscreenToggle
        },
        {
            key: 'm',
            description: volumeToggle
        }, {
            key: '0-9',
            description: seekPercent
        }
    ];
}

export default class ShortcutsTooltip {
    el: HTMLElement;
    private _container: HTMLElement;
    private _api: PlayerAPI;
    private _model: ViewModel;
    private _onVisibility: (visible: boolean) => void;
    private isOpen: boolean;
    private lastState: string | null;
    private shortcutToggleUi: UI;
    private settingsInteraction: StringObject;

    constructor(container: HTMLElement, api: PlayerAPI, model: ViewModel, onVisibility: (visible: boolean) => void) {
        this._container = container;
        this._api = api;
        this._model = model;
        this._onVisibility = onVisibility;
        const shortcuts = model.get('localization').shortcuts;
        this.el = createElement(
            shortcutTooltipTemplate(getShortcuts(shortcuts), shortcuts.keyboardShortcuts)
        );
        this.shortcutToggleUi = new UI(this.el.querySelector('.jw-switch'));
        this.isOpen = false;
        this.lastState = null;
        this.settingsInteraction = { reason: 'settingsInteraction' };
        this._render();
    }

    open(): void {
        this.shortcutToggleUi.el.setAttribute('aria-checked', this._model.get('enableShortcuts'));

        addClass(this.el, 'jw-open');
        this.lastState = this._model.get('state');
        const shortcutsClose = this.el.querySelector('.jw-shortcuts-close') as HTMLElement;
        if (shortcutsClose) {
            shortcutsClose.focus();
        }
        document.addEventListener('click', this._documentClickHandler);
        this.isOpen = true;
        this._api.pause(this.settingsInteraction);
        this._onVisibility(true);
    }

    close(): void {
        removeClass(this.el, 'jw-open');
        document.removeEventListener('click', this._documentClickHandler);
        this.isOpen = false;
        if (this.lastState === STATE_PLAYING) {
            this._api.play(this.settingsInteraction);
        }
        this._onVisibility(false);
    }

    destroy(): void {
        this.close();
        this.shortcutToggleUi.destroy();
    }

    toggleVisibility(): void {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    _documentClickHandler(e: Event): void {
        const target = e.target as HTMLElement;
        if (!/jw-shortcuts|jw-switch/.test(target.className)) {
            this.close();
        }
    }

    _toggleClickHandler(e: Event): void {
        const toggle = e.currentTarget as HTMLElement;
        const isChecked = toggle.getAttribute('aria-checked') !== 'true';
        toggle.setAttribute('aria-checked', isChecked.toString());
        this._model.set('enableShortcuts', isChecked);
    }

    _render(): void {
        const closeButton = button(
            'jw-shortcuts-close',
            close,
            this._model.get('localization').close,
            [cloneIcon('close')]
        );

        //  Append close button to modal.
        prependChild(this.el, closeButton.element());
        closeButton.show();

        //  Append modal to container
        this._container.appendChild(this.el);

        this.shortcutToggleUi.on('click tap enter', this._toggleClickHandler);
    }
}
