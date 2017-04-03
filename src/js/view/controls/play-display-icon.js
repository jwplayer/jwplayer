define([
    'utils/helpers',
    'utils/backbone.events',
    'utils/ui',
    'templates/display-icon.html',
    'utils/underscore'
], function(utils, Events, UI, Template, _) {

    return class PlayDisplayIcon {
        constructor(_model) {
            _.extend(this, Events);
            this.model = _model;

            this.el = utils.createElement(Template({
                iconName: 'display',
                ariaLabel: this.model.get('localization').playback
            }));

            this.iconUI = new UI(this.el).on('click tap', (evt) => {
                this.trigger(evt.type);
            });

            this.model.on('change:state', (model, newstate) => {
                var iconDisplay = this.el.getElementsByClassName('jw-icon-display');
                if (iconDisplay.length) {
                    var localization = this.model.get('localization');
                    var newstateLabel = localization.playback;
                    switch (newstate) {
                        case 'buffering':
                            newstateLabel = localization.buffer;
                            break;
                        case 'playing':
                            newstateLabel = localization.pause;
                            break;
                        case 'complete':
                            newstateLabel = localization.replay;
                            break;
                        default:
                            newstateLabel = '';
                            break;
                    }
                    if (newstateLabel === '') {
                        iconDisplay[0].removeAttribute('aria-label');
                    } else {
                        iconDisplay[0].setAttribute('aria-label', newstateLabel);
                    }
                }
            });
        }

        element() {
            return this.el;
        }
    };
});
