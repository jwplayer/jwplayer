import UI from 'utils/ui';

export default class RewindDisplayIcon {
    constructor(model, api, element) {
        this.el = element;

        this.ui = new UI(this.el).on('click tap enter', function() {
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
}
