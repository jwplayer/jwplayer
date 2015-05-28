define([
    'utils/helpers',
    'utils/backbone.events',
    'events/events',
    'utils/ui',
    'handlebars-loader!templates/displayicon.html',
    'utils/underscore'
], function(utils, Events, events, UI, Template, _) {

    var DisplayIcon = function(_model) {
        _.extend(this, Events);

        this.model = _model;

        this.el = utils.createElement(Template({}));

        var _this = this;
        this.iconUI = new UI (this.el).on(events.touchEvents.CLICK, function(){_this.trigger('click');})
            .on(events.touchEvents.TAP, function(){_this.trigger('tap');});
    };

    _.extend(DisplayIcon.prototype, {
        element : function() { return this.el; }
    });

    return DisplayIcon;
});
