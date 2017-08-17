import displayIconTemplate from 'view/controls/templates/display-icon';
import PLAY_ICON from 'assets/SVG/play.svg';
import PAUSE_ICON from 'assets/SVG/pause.svg';
import BUFFER_ICON from 'assets/SVG/buffer.svg';
import REPLAY_ICON from 'assets/SVG/replay.svg';
import ERROR_ICON from 'assets/SVG/playback-error.svg';
import utils from 'utils/helpers';
import Events from 'utils/backbone.events';
import UI from 'utils/ui';

export default class PlayDisplayIcon {
    constructor(_model) {
        Object.assign(this, Events);

        const localization = _model.get('localization');
        const playPauseSvgs = PLAY_ICON.concat('', PAUSE_ICON, '', BUFFER_ICON, '', REPLAY_ICON, '', ERROR_ICON);
        const element = utils.createElement(displayIconTemplate('display', localization.playback, playPauseSvgs));
        const iconDisplay = element.getElementsByClassName('jw-icon-display')[0];
        element.style.cursor = 'pointer';
        this.icon = iconDisplay;
        this.el = element;

        new UI(this.el).on('click tap', (evt) => {
            this.trigger(evt.type);
        });

        _model.on('change:state', (model, newstate) => {
            let newstateLabel;
            switch (newstate) {
                case 'buffering':
                    newstateLabel = localization.buffer;
                    break;
                case 'playing':
                    newstateLabel = localization.pause;
                    break;
                case 'paused':
                    newstateLabel = localization.playback;
                    break;
                case 'complete':
                    newstateLabel = localization.replay;
                    break;
                default:
                    newstateLabel = '';
                    break;
            }
            if (newstateLabel === '') {
                iconDisplay.removeAttribute('aria-label');
            } else {
                iconDisplay.setAttribute('aria-label', newstateLabel);
            }
        });
    }

    element() {
        return this.el;
    }
}
