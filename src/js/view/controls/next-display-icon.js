import UI from 'utils/ui';

export default class NextDisplayIcon {
    constructor(model, api, element) {

        new UI(element).on('click tap enter', function() {
            api.next();
        });

        model.change('nextUp', function(nextUpChangeModel, nextUp) {
            element.style.visibility = nextUp ? '' : 'hidden';
            element.style.opacity = nextUp ? 1 : 0;
        });

        this.el = element;
    }

    element() {
        return this.el;
    }
}
