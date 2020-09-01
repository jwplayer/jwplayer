import { style } from 'utils/css';
import { addClass } from 'utils/dom';
import { cloneIcon } from 'view/controls/icons';
import button from 'view/controls/components/button';
import type { PlayerAPI, Localization } from 'types/generic.type';

export default function TizenErrorContainer(
    api: PlayerAPI,
    errorContainer: HTMLElement,
    localization: Localization
): HTMLElement {
    addClass(errorContainer, 'jw-tizen-app');

    const errorIcon = cloneIcon('error');
    const iconContainer = errorContainer.querySelector('.jw-icon');
    style(iconContainer, {
        width: '100px',
        height: '100px'
    });
    if (iconContainer && errorIcon) {
        iconContainer.appendChild(errorIcon);
    }

    const prevButton = button('jw-previous', () => api.trigger('backClick'), localization.prev);
    const prevEl = prevButton.element();
    prevEl.textContent = localization.prev;
    prevButton.show();

    const infoContainer = errorContainer.querySelector('.jw-info-container');
    style(infoContainer, {
        marginLeft: '80px'
    });

    if (infoContainer) {
        infoContainer.appendChild(prevEl);
    }

    const handleKeydown = (evt: KeyboardEvent) => {
        switch (evt.keyCode) {
            case 13: // center/enter
            case 10009: // Back
                removeEventListener();
                api.trigger('backClick');
                break;
            case 10182: // Exit/Home
                removeEventListener();
                break;
            default:
                break;
        }
    };

    // For the TV app to hear events
    document.addEventListener('keydown', handleKeydown);

    function removeEventListener(): void {
        document.removeEventListener('keydown', handleKeydown);
    }

    return errorContainer;
}
