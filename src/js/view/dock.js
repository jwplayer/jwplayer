define([
    'templates/dock.html',
    'utils/helpers',
    'utils/underscore',
    'utils/ui'
], function(dockTemplate, utils, _, UI) {

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
            new UI (this.el).on('click tap', clickHandler);
        },
        getDockButton : function(evt) {
            if (utils.hasClass(evt.target, 'jw-dock-button')) {
                // Clicks on button container
                return evt.target;
            } else if (utils.hasClass(evt.target, 'jw-dock-text')) {
                // Clicks on the text overlay
                return evt.target.parentElement.parentElement;
            }

            // Clicks on any other children
            return evt.target.parentElement;
        },
        click : function(evt) {
            var elem = this.getDockButton(evt);

            var btnId = elem.getAttribute('button');
            var buttons = this.model.get('dock');
            var btn = _.findWhere(buttons, {id : btnId});

            if (btn && btn.callback) {
                btn.callback(evt);
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
