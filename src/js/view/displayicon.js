define([
    'utils/helpers',
    'utils/css',
    'utils/backbone.events',
    'handlebars-loader!templates/displayicon.html',
    'underscore'
], function(utils, cssUtils, Events, Template, _) {

    var DisplayIcon = function(_model) {
        _.extend(this, Events);

        this.model = _model;

        this.el = utils.createElement(Template({}));

        var _this = this;
        this.el.onclick = function() {
            _this.trigger('click');
        };
    };

    _.extend(DisplayIcon.prototype, {
        element : function() { return this.el; }
    });

    return DisplayIcon;
});
