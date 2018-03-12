import Events from 'utils/backbone.events';
import UI from 'utils/ui';
import { addClass, removeClass } from 'utils/dom';

export default class PlayDisplayIcon {
    constructor(_model, api, element) {
        Object.assign(this, Events);

        const localization = _model.get('localization');
        const iconDisplay = element.getElementsByClassName('jw-icon-display')[0];
        const idleClass = _model.get('idleClass');
        element.style.cursor = 'pointer';
        this.icon = iconDisplay;
        this.el = element;

        new UI(this.el).on('click tap enter', (evt) => {
            this.trigger(evt.type);
        });

        _model.on('change:state', (model, newState, oldState) => {
            let newStateLabel;
            switch (newState) {
                case 'buffering':
                    newStateLabel = localization.buffer;
                    break;
                case 'playing':
                    newStateLabel = localization.pause;
                    break;
                case 'paused':
                    newStateLabel = localization.playback;
                    break;
                case 'complete':
                    newStateLabel = localization.replay;
                    break;
                case 'idle':
                    newStateLabel = localization.playback;
                    break;
                default:
                    newStateLabel = '';
                    break;
            }
            if (newStateLabel === '') {
                iconDisplay.removeAttribute('aria-label');
            } else {
                iconDisplay.setAttribute('aria-label', newStateLabel);
            }

            this.toggleIdleClass(oldState, newState, idleClass);
        });

        this.toggleIdleClass('', 'idle', idleClass);
    }

    element() {
        return this.el;
    }

    toggleIdleClass(oldState, newState, idleClass) {
        if (idleClass !== 'stroke' && idleClass !== 'fill') {
            return;
        }

        if (oldState === 'idle') {
            removeClass(this.icon, 'jw-ab-idle-' + idleClass);
        } else if (newState === 'idle') {
            addClass(this.icon, 'jw-ab-idle-' + idleClass);
        }
    };
}
