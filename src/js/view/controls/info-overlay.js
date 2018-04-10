import InfoOverlayTemplate from 'view/controls/templates/info-overlay';
import { addClass, createElement, prependChild, removeClass } from 'utils/dom';
import { STATE_PLAYING, STATE_PAUSED } from 'events/events';
import { addInteractionListeners, removeInteractionListeners } from 'view/utils/interaction-listeners';
import button from 'view/controls/components/button';
import { cloneIcon } from 'view/controls/icons';
import { timeFormat } from 'utils/parser';

export default function (container, model, api) {
    const template = createElement(InfoOverlayTemplate());
    const openClass = 'jw-info-open';
    const infoOverlayInteraction = 'infoOverlayInteraction';
    const closeButton = button('jw-info-close', () => {
        instance.close();
    }, 'Close Info Overlay', [cloneIcon('close')]);
    closeButton.show();
    prependChild(template, closeButton.element());

    let appended = false;
    let lastState = null;
    let visible = false;

    const documentClickHandler = (e) => {
        const targetClass = e.target.className;
        if (!targetClass.match(/jw-info/)) {
            instance.close();
        }
    };

    const append = () => {
        attachListeners();
        container.appendChild(template);
        appended = true;
    };

    function attachListeners() {
        const titleContainer = template.querySelector('.jw-info-title');
        const durationContainer = template.querySelector('.jw-info-duration');
        const descriptionContainer = template.querySelector('.jw-info-description');
        const clientIdContainer = template.querySelector('.jw-info-clientid');

        model.change('title', (changeModel, title = 'Unknown Title') => {
            titleContainer.textContent = title;
        });
        model.change('duration', (changeModel, duration = '') => {
            durationContainer.textContent = (duration < 0 ? 'Live' : timeFormat(duration));
        });
        model.change('description', (changeModel, description = '') => {
            descriptionContainer.textContent = description;
        });
        clientIdContainer.textContent = `Client ID: ${getClientId()}`;
    }

    const instance = {
        open() {
            if (!appended) {
                append();
            }
            addClass(template, openClass);
            addInteractionListeners(document, documentClickHandler);
            visible = true;

            const state = model.get('state');
            if (state === STATE_PLAYING) {
                api.pause(infoOverlayInteraction);
            }
            lastState = state;
        },
        close() {
            removeClass(template, openClass);
            removeInteractionListeners(document, documentClickHandler);
            visible = false;

            const state = model.get('state');
            if (state === STATE_PAUSED && lastState === STATE_PLAYING) {
                api.play(infoOverlayInteraction);
            }
            lastState = null;
        }
    };

    Object.defineProperties(instance, {
        visible: {
            enumerable: true,
            get: () => visible
        }
    });

    return instance;
}

function getClientId() {
    try {
        return window.localStorage.jwplayerLocalId;
    } catch (e) {
        return 'none';
    }
}
