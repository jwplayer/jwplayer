import InfoOverlayTemplate from 'view/controls/templates/info-overlay';
import { createElement, prependChild, replaceInnerHtml } from 'utils/dom';
import { STATE_PLAYING, STATE_PAUSED } from 'events/events';
import button from 'view/controls/components/button';
import { cloneIcon } from 'view/controls/icons';
import { timeFormat } from 'utils/parser';

export default function (container, model, api, onVisibility) {
    const template = createElement(InfoOverlayTemplate());
    const infoOverlayInteraction = 'infoOverlayInteraction';
    let appended = false;
    let lastState = null;
    let visible = false;

    const documentClickHandler = (e) => {
        if (!/jw-info/.test(e.target.className)) {
            instance.close();
        }
    };

    const append = () => {
        const closeButton = button('jw-info-close', () => {
            instance.close();
        }, model.get('localization').close, [cloneIcon('close')]);
        closeButton.show();
        prependChild(template, closeButton.element());
        attachListeners();
        container.appendChild(template);
        appended = true;
    };

    function attachListeners() {
        const titleContainer = template.querySelector('.jw-info-title');
        const durationContainer = template.querySelector('.jw-info-duration');
        const descriptionContainer = template.querySelector('.jw-info-description');
        const clientIdContainer = template.querySelector('.jw-info-clientid');

        model.change('playlistItem', (changeModel, item) => {
            const { description, title } = item;
            replaceInnerHtml(descriptionContainer, description || '');
            replaceInnerHtml(titleContainer, title || 'Unknown Title');
        });
        model.change('duration', (changeModel, duration) => {
            const streamType = model.get('streamType');
            let durationText = '';
            switch (streamType) {
                case 'LIVE':
                    durationText = 'Live';
                    break;
                case 'DVR':
                    durationText = 'DVR';
                    break;
                default:
                    if (duration) {
                        durationText = timeFormat(duration);
                    }
            }
            durationContainer.textContent = durationText;
        }, instance);
        clientIdContainer.textContent = `Client ID: ${getClientId()}`;
    }

    const instance = {
        open() {
            if (!appended) {
                append();
            }
            // addClass(template, openClass);
            document.addEventListener('click', documentClickHandler);
            visible = true;

            const state = model.get('state');
            if (state === STATE_PLAYING) {
                api.pause(infoOverlayInteraction);
            }
            lastState = state;
            onVisibility(true);
        },
        close() {
            // removeClass(template, openClass);
            document.removeEventListener('click', documentClickHandler);
            visible = false;

            const state = model.get('state');
            if (state === STATE_PAUSED && lastState === STATE_PLAYING) {
                api.play(infoOverlayInteraction);
            }
            lastState = null;
            onVisibility(false);
        },
        destroy() {
            this.close();
            model.off(null, null, this);
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
