import Eventable from 'utils/eventable';
import UI from 'utils/ui';
import { addClass, createElement } from 'utils/dom';

export default class PlayDisplayIcon extends Eventable {
    constructor(_model, api, element) {
        super();
        const localization = _model.get('localization');
        const iconDisplay = element.querySelector('.jw-icon');

        this.icon = iconDisplay;
        this.el = element;
        this.ui = new UI(iconDisplay).on('click tap enter', (evt) => {
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
