define([
    'templates/dock.html',
    'utils/helpers',
    'utils/underscore',
    'utils/ui'
], function(dockTemplate, utils, _, UI) {

    const getDockButton = function(evt) {
        if (utils.hasClass(evt.target, 'jw-dock-button')) {
            // Clicks on button container
            return evt.target;
        } else if (utils.hasClass(evt.target, 'jw-dock-text')) {
            // Clicks on the text overlay
            return evt.target.parentElement.parentElement;
        }

        // Clicks on any other children
        return evt.target.parentElement;
    };

    return class Dock {

        constructor(_model) {
            this.model = _model;

            this.setup();
            this.model.on('change:dock', this.render, this);
        }

        setup() {
            const buttons = this.model.get('dock');
            const clickHandler = this.click.bind(this);

            const html = dockTemplate(buttons);
            this.el = utils.createElement(html);
            new UI(this.el).on('click tap', clickHandler);
        }

        click(evt) {
            const elem = getDockButton(evt);

            const btnId = elem.getAttribute('button');
            const buttons = this.model.get('dock');
            const btn = _.findWhere(buttons, { id: btnId });

            if (btn && btn.callback) {
                btn.callback(evt);
            }
        }

        render() {
            const buttons = this.model.get('dock');
            const html = dockTemplate(buttons);
            const newEl = utils.createElement(html);

            this.el.innerHTML = newEl.innerHTML;
        }

        element() {
            return this.el;
        }
    };

});
