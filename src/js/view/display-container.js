define([
    'utils/helpers',
    'utils/backbone.events',
    'utils/ui',
    'templates/display-container.html',
    'utils/underscore'
], function(utils, Events, UI, Template, _) {
    var DisplayContainer = function() {
        this.el = utils.createElement(Template());
        this.container = this.el.querySelector('.jw-display-controls');
        this.addButton = function (button) {
            this.container.appendChild(button.el);
        };
    };

    _.extend(DisplayContainer.prototype, {
        element: function() {
          return this.el;
        }
    });

    return DisplayContainer;
});
