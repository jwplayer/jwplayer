define([
    'utils/helpers',
    'utils/css',
    'handlebars-loader!templates/displayicon.html',
    'underscore'
], function(utils, cssUtils, Template, _) {

    var DisplayIcon = function(_model) {
        this.model = _model;

        this.el = utils.createElement(Template({}));
    };

    _.extend(DisplayIcon.prototype, {
        element : function() { return this.el; }
    });

    return DisplayIcon;
});
