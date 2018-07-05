import Events from 'utils/backbone.events';
import UI from 'utils/ui';
import { addClass, removeClass, createElement } from 'utils/dom';

export default class PlayDisplayIcon {
    constructor(_model, api, element) {
        Object.assign(this, Events);

        const localization = _model.get('localization');
        const iconDisplay = element.getElementsByClassName('jw-icon-display')[0];
        const idleButtonText = _model.get('idleButtonText');
        element.style.cursor = 'pointer';
        this.icon = iconDisplay;
        this.el = element;

        new UI(this.el).on('click tap enter', (evt) => {
            this.trigger(evt.type);
        });

        _model.on('change:state', (model, newState) => {
            let newStateLabel;
            switch (newState) {
                case 'buffering':
                    newStateLabel = localization.buffer;
                    break;
                case 'playing':
                    newStateLabel = localization.pause;
                    break;
                case 'idle':
                case 'paused':
                    newStateLabel = localization.playback;
                    break;
                case 'complete':
                    newStateLabel = localization.replay;
                    break;
                default:
                    newStateLabel = '';
                    break;
            }
            if (newStateLabel !== '') {
                iconDisplay.setAttribute('aria-label', newStateLabel);
            } else {
                iconDisplay.removeAttribute('aria-label');
            }

            this.toggleIdleClass(newState, idleButtonText);
        });

        this.toggleIdleClass(_model.get('state'), idleButtonText);
    }

    element() {
        return this.el;
    }

    toggleIdleClass(state, idleButtonText) {
        if (!/^(click to play|play|watch now)$/i.test(idleButtonText)) {
            return;
        }

        let element = this.icon.getElementsByClassName('jw-idle-icon-text')[0];
        if (!element) {
            element = createElement(`<span class="jw-idle-icon-text"></span>`);
            this.icon.appendChild(element);
        }

        if (state === 'idle') {
            addClass(this.icon, 'jw-ab-idle-label');
            element.textContent = idleButtonText;
        } else {
            removeClass(this.icon, 'jw-ab-idle-label');
            element.textContent = '';
        }
    }
}
