define([
    'utils/helpers',
    'utils/ui',
    'templates/display-icon.html'
], function(utils, UI, Template) {

    return class NextDisplayIcon {

        constructor(model, api) {
            const element = utils.createElement(Template({
                iconName: 'next',
                ariaLabel: model.get('localization').next
            }));

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
    };
});
