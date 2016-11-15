define([
    'utils/helpers',
    'utils/backbone.events',
    'utils/ui',
    'templates/display-icon.html',
    'utils/underscore'
], function(utils, Events, UI, Template, _) {
    var NextDisplayIcon = function(model, api) {
        this.el = utils.createElement(Template({
            iconName: 'next',
            ariaLabel: model.get('localization').next
        }));
        // evt
        this.iconUI = new UI (this.el).on('click tap', function() {
            api.next();
        });
    };

    _.extend(NextDisplayIcon.prototype, {
        element: function() {
            return this.el;
        }
    });

    return NextDisplayIcon;
});
