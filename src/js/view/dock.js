define([
    'handlebars-loader!templates/dock.html',
    'utils/helpers',
    'utils/underscore',
    'utils/ui',
    'events/events'
], function(dockTemplate, utils, _, UI, events) {

    var Dock = function(_model) {
        this.model = _model;

        this.setup();
        this.model.on('change:dock', this.render, this);
    };

    _.extend(Dock.prototype, {
        setup : function() {
            var buttons = this.model.get('dock');
            var clickHandler = this.click.bind(this);

            var html = dockTemplate(buttons);
            this.el = utils.createElement(html);
            new UI (this.el).on(events.touchEvents.TAP, clickHandler).on(events.touchEvents.CLICK, clickHandler);
        },
        click : function(evt) {
            var btnId = evt.target.getAttribute('button');

            var buttons = this.model.get('dock');
            var btn = _.findWhere(buttons, {id : btnId});

            if (btn.callback) {
                btn.callback();
            }
        },
        render: function() {
            var buttons = this.model.get('dock');
            var html = dockTemplate(buttons);
            var newEl = utils.createElement(html);

            this.el.innerHTML = newEl.innerHTML;
        },
        element : function() {
            return this.el;
        }
    });
    return Dock;
});
