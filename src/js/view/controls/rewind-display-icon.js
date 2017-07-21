import displayIconTemplate from 'view/controls/templates/display-icon';

define([
    'utils/helpers',
    'utils/ui',
], function(utils, UI) {

    return class RewindDisplayIcon {
        constructor(model, api) {
            this.el = utils.createElement(displayIconTemplate('rewind', model.get('localization').playback));

            this.iconUI = new UI(this.el).on('click tap', function() {
                const currentPosition = model.get('position');
                const duration = model.get('duration');
                const rewindPosition = currentPosition - 10;
                let startPosition = 0;

                // duration is negative in DVR mode
                if (model.get('streamType') === 'DVR') {
                    startPosition = duration;
                }
                // Seek 10s back. Seek value should be >= 0 in VOD mode and >= (negative) duration in DVR mode
                api.seek(Math.max(rewindPosition, startPosition));
            });
        }

        element() {
            return this.el;
        }
    };
});
