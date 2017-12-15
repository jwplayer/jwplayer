import overlayTemplate from 'view/controls/templates/overlay-interface';
import {toggleClass} from 'utils/dom';
import UI from 'utils/ui';
import Events from 'utils/backbone.events';
import utils from 'utils/helpers';
import {cloneIcon} from 'view/controls/icons';

export default class OverlayInterface {
    constructor(model, playerElement) {
        this._playerElement = playerElement;
        this._model = model;
        this.buttons = [];
    }

    setup(context) {
        const viewModel = this._model;
        const playerViewModel = viewModel.player;
        // Listen for duration changes to determine the offset from the end for when next up should be shown
        const items = viewModel.get('playlistItem').overlay;
        this.container = context.createElement('div');
        this.container.className = 'jw-interface-container jw-reset';
        // this.addContent(this.container);

        for (let i = 0; i < items.length; i++) {
            this.buttons.push(this.createButton(items[i]));
        }
        
        for (let i = 0; i < this.buttons.length; i++) {
            this.container.appendChild(this.buttons[i]);   
        }

        this.addContent(this.container);

        // playerViewModel.change('duration', this.onDuration, this);
        // // Listen for position changes so we can show the tooltip when the offset has been crossed
        // playerViewModel.change('position', this.onElapsed, this);

        // playerViewModel.change('state', function (stateChangeModel, state) {
        //     if (state === 'complete') {
        //         //destroy all buttons
        //     }
        // }, this);
    }

    createButton(overlay) {
        const element = utils.createElement(overlayTemplate(overlay.description));
        element.querySelector('.jw-interface-close').appendChild(cloneIcon('close'));
        // this.addContent(element);

        // this.closeButton = this.content.querySelector('.jw-interface-close');
        // this.closeButton.setAttribute('aria-label', this.nextUpClose);
        // this.tooltip = this.content.querySelector('.jw-interface-tooltip');

        return element;
    }

    addContent(elem) {
        if (this.content) {
            this.removeContent();
        }
        this.content = elem;
        // this.container.appendChild(elem);
    }

    onDuration(model, duration) {
        if (!duration) {
            return;
        }

        // Use nextupoffset if set or default to 10 seconds from the end of playback
        let offset = utils.seconds(model.get('overlay-offset'));
        if (offset < 0) {
            // Determine offset from the end. Duration may change.
            offset += duration;
        }

        this.offset = offset;
    }

    element() {
        return this.container;
    }
}