define([
    'utils/helpers',
    'templates/display-container.html'
], function(utils, Template) {

    return class DisplayContainer {
        constructor() {
            this.el = utils.createElement(Template());
            this.container = this.el.querySelector('.jw-display-controls');
        }

        addButton(button) {
            this.container.appendChild(button.el);
        }

        element() {
            return this.el;
        }
    };

});
