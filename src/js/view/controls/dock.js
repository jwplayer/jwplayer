import dockTemplate from 'view/controls/templates/dock';

define([
    'utils/helpers',
    'utils/underscore',
    'utils/ui'
], function(utils, _, UI) {

    function getDockButton(evt) {
        if (utils.hasClass(evt.target, 'jw-dock-button')) {
            // Clicks on button container
            return evt.target;
        } else if (utils.hasClass(evt.target, 'jw-dock-text')) {
            // Clicks on the text overlay
            return evt.target.parentElement.parentElement;
        }

        // Clicks on any other children
        return evt.target.parentElement;
    }

    function getDockContainer(buttons) {
        const html = dockTemplate(buttons);
        return utils.createElement(html);
    }

    return class Dock {
        constructor(_model) {
            this.model = _model;

            const buttons = this.model.get('dock');

            this.el = getDockContainer(buttons);
            new UI(this.el).on('click tap', this.click, this);

            this.model.on('change:dock', (model, changedButtons) => {
                const newEl = getDockContainer(changedButtons);
                utils.emptyElement(this.el);
                for (let i = newEl.childNodes.length; i--;) {
                    this.el.appendChild(newEl.firstChild);
                }
            }, this);
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

        element() {
            return this.el;
        }
    };

});
