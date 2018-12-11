import Events from 'utils/backbone.events';
import UI from 'utils/ui';
import { addClass, createElement } from 'utils/dom';

export default class PlayDisplayIcon {
    constructor(_model, api, element) {
        Object.assign(this, Events);

        const localization = _model.get('localization');
        const iconDisplay = element.getElementsByClassName('jw-icon-display')[0];
        element.style.cursor = 'pointer';
        this.icon = iconDisplay;
        this.el = element;

        this.ui = new UI(this.el).on('click tap enter', (evt) => {
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
                element.setAttribute('aria-label', newStateLabel);
            } else {
                element.removeAttribute('aria-label');
            }
        });

        if (_model.get('displayPlaybackLabel')) {
            let iconText = this.icon.getElementsByClassName('jw-idle-icon-text')[0];
            if (!iconText) {
                iconText = createElement(`<div class="jw-idle-icon-text"></div>`);
                addClass(this.icon, 'jw-idle-label');
                iconText.textContent = localization.playback;
                this.icon.appendChild(iconText);
            }
        }
    }

    element() {
        return this.el;
    }
}
