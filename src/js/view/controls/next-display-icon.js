import UI from 'utils/ui';

export default class NextDisplayIcon {
    constructor(model, api, element) {
        const iconDisplay = element.querySelector('.jw-icon');

        this.ui = new UI(iconDisplay).on('click tap enter', function() {
            api.next({ reason: 'interaction' });
        });

        model.change('nextUp', function(nextUpChangeModel, nextUp) {
            element.style.visibility = nextUp ? '' : 'hidden';
        });

        this.el = element;
    }

    element() {
        return this.el;
    }
}
