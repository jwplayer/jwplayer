import displayIconTemplate from 'view/controls/templates/display-icon';
import NEXT_ICON from 'assets/SVG/next.svg';
import utils from 'utils/helpers';
import UI from 'utils/ui';

export default class NextDisplayIcon {
    constructor(model, api) {
        const element = utils.createElement(displayIconTemplate('next', model.get('localization').next, NEXT_ICON));

        model.change('nextUp', function(nextUpChangeModel, nextUp) {
            element.style.display = nextUp ? '' : 'none';
        });

        this.el = element;
    }

    element() {
        return this.el;
    }
}
