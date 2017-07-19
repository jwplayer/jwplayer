import displayIconTemplate from 'view/controls/templates/display-icon';

define([
    'utils/helpers',
    'utils/backbone.events',
    'utils/ui',
    'utils/underscore'
], function(utils, Events, UI, _) {

    return class PlayDisplayIcon {
        constructor(_model) {
            _.extend(this, Events);

            const localization = _model.get('localization');
            const element = utils.createElement(displayIconTemplate('display', localization.playback));
            const iconDisplay = element.getElementsByClassName('jw-icon-display')[0];
            element.style.cursor = 'pointer';
            this.icon = iconDisplay;
            this.el = element;

            this.iconUI = new UI(this.el).on('click tap', (evt) => {
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
    };
});
