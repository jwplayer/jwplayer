define([
    'utils/helpers',
    'utils/backbone.events',
    'utils/ui',
    'templates/displayicon.html',
    'utils/underscore'
], function(utils, Events, UI, Template, _) {

    var DisplayIcon = function(_model) {
        _.extend(this, Events);

        this.model = _model;

        this.el = utils.createElement(Template({}));

        var _this = this;
        this.iconUI = new UI (this.el).on('click tap', function(evt){_this.trigger(evt.type);});

    };

    _.extend(DisplayIcon.prototype, {
        element : function() { return this.el; }
    });

    return DisplayIcon;
});
