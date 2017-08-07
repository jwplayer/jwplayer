import displayIconTemplate from 'view/controls/templates/display-icon';
import utils from 'utils/helpers';
import UI from 'utils/ui';

export default class NextDisplayIcon {
    constructor(model, api) {
        const element = utils.createElement(displayIconTemplate('next', model.get('localization').next));

        this.iconUI = new UI(element).on('click tap', function() {
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
