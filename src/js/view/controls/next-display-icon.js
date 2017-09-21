import UI from 'utils/ui';

export default class NextDisplayIcon {
    constructor(model, api, element) {

        new UI(element).on('click tap enter', function() {
            api.next();
        });

        model.change('nextUp', function(nextUpChangeModel, nextUp) {
            element.style.display = nextUp ? '' : 'none';
        });

        this.el = element;
    }

    element() {
        return this.el;
    }
}
