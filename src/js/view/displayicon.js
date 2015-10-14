define([
    'utils/helpers',
    'utils/backbone.events',
    'utils/ui',
    'handlebars-loader!templates/displayicon.html',
    'utils/underscore'
], function(utils, Events, UI, Template, _) {

    var DisplayIcon = function(_model) {
        _.extend(this, Events);

        this.model = _model;

        this.el = utils.createElement(Template({}));

        var _this = this;
        this.iconUI = new UI (this.el).on('click tap', function(evt){_this.trigger(evt.type);});

        // disable pointer events on this elements in Chrome
        // so that clicks get passed through to swf object tags
        // allowing playback to start without Flash throttling
        if (utils.isChrome()) {
            this.el.style.pointerEvents = 'none';
        }
    };

    _.extend(DisplayIcon.prototype, {
        element : function() { return this.el; }
    });

    return DisplayIcon;
});
