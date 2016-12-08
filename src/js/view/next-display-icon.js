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
        this.iconUI = new UI (this.el).on('click tap', function() {
            api.next();
        });
        this.el.style.display = 'none';
        model.on('change:nextUp', function(model, nextUp) {
            this.el.style.display = nextUp ? '' : 'none';
        }, this);
    };

    _.extend(NextDisplayIcon.prototype, {
        element: function() {
            return this.el;
        }
    });

    return NextDisplayIcon;
});
