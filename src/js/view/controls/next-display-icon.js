import UI from 'utils/ui';

export default class NextDisplayIcon {
    constructor(model, api, element) {

        this.ui = new UI(element).on('click tap enter', function() {
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
