import CLOSE_ICON from 'assets/SVG/close.svg';
import button from 'view/controls/components/button';
import SettingsMenuTemplate from 'view/controls/templates/settings/settings-menu';
import { createElement } from 'utils/dom';

export default function SettingsMenu(visibilityChangeHandler) {
    const documentClickHandler = (e) => {
        // Close if anything other than the settings menu has been clicked
        // Let the display (jw-video) handles closing itself (display clicks do not pause if the menu is open)
        // Don't close if the user has dismissed the nextup tooltip via it's close button (the tooltip overlays the menu)
        const targetClass = e.target.className;
        if (!targetClass.match(/jw-(settings|video|nextup-close)/)) {
            instance.close();
        }
    };

    const instance = {
        setup() {
            const closeButton = button('jw-settings-close', () => {
                this.close();
            }, 'Close Settings', [CLOSE_ICON]);
            closeButton.show();

            const settingsMenuElement = createElement(SettingsMenuTemplate());
            settingsMenuElement.querySelector('.jw-settings-topbar').appendChild(closeButton.element());

            this.el = settingsMenuElement;
            this.visible = false;
        },
        open() {
            this.visible = true;
            visibilityChangeHandler(true);
            addDocumentListeners(documentClickHandler);
        },
        close() {
            this.visible = false;
            visibilityChangeHandler(false);
            removeDocumentListeners(documentClickHandler);
        },
        toggle() {
            if (this.visible) {
                this.close();
            } else {
                this.open();
            }
        },
        element() {
            return this.el;
        }
    };

    return instance;
}

const addDocumentListeners = (handler) => {
    const addListener = document.addEventListener;
    addListener('mousedown', handler);
    addListener('pointerdown', handler);
    addListener('touchstart', handler);
};

const removeDocumentListeners = (handler) => {
    const removeListener = document.removeEventListener;
    removeListener('mousedown', handler);
    removeListener('pointerdown', handler);
    removeListener('touchstart', handler);
};
