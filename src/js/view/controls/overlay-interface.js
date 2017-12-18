import overlayTemplate from 'view/controls/templates/overlay-interface';
import UI from 'utils/ui';
import Events from 'utils/backbone.events';
import utils from 'utils/helpers';
import { cloneIcon } from 'view/controls/icons';

export default class OverlayInterface {
    constructor(_model, _api, playerElement) {
        Object.assign(this, Events);
        this._model = _model;
        this._api = _api;
        this._playerElement = playerElement;
        this.overlays = null;
        this.currentOverlay = null;
        this.currentIndex = 0;
        this.nextOverlay = null;
        this.close = _model.get('localization').close;
        this.showing = false;
    }

    setup(context) {
        this.container = context.createElement('div');
        this.container.className = 'jw-interface-container jw-reset';
        const element = utils.createElement(overlayTemplate());
        element.querySelector('.jw-interface-close').appendChild(cloneIcon('close'));
        this.addContent(element);

        this.closeButton = this.content.querySelector('.jw-interface-close');
        this.closeButton.setAttribute('aria-label', this.close);
        this.tooltip = this.content.querySelector('.jw-interface-tooltip');

        const viewModel = this._model;
        const playerViewModel = viewModel.player;
        const playlistItem = viewModel.get('playlistItem');

        this.overlays = playlistItem.overlay;

        viewModel.on('change:playlistItem', this.onPlaylistItem, this);

        playerViewModel.change('position', this.onPosition, this);

        playerViewModel.change('state', function (stateChangeModel, state) {
            if (state === 'complete') {
                this.toggle(false);
            }
        }, this);

        // Close button
        new UI(this.closeButton, { directSelect: true })
            .on('click tap enter', function () {
                this.toggle(false);
            }, this);
        // Tooltip
        new UI(this.tooltip)
            .on('click tap', this.click, this); 

        this.setNextOverlay(this.overlays[this.currentIndex]);
    }

    onPlaylistItem(model, playlistItem) {
        this.reset();

        if (!playlistItem) {
            return;
        }

        console.log(playlistItem);

        this.overlays = playlistItem.overlay;
        this.setNextOverlay(this.overlays[this.currentIndex]);
    }   

    onPosition(model, position) {
        if (!position || model.get('state') !== 'playing') {
            return;
        }

        position = Math.round(position);

        if (!this.showing && position === this.currentOverlay.showAt) {
            this.showing = true;
            this.toggle(true);
        } else if (this.showing && position === this.currentOverlay.endAt) {
            this.showing = false;
            this.toggle(false);
        }
    }

    addContent(elem) {
        if (this.content) {
            this.removeContent();
        }
        this.content = elem;
        this.container.appendChild(elem);
    }

    removeContent() {
        if (this.content) {
            this.container.removeChild(this.content);
            this.content = null;
        }
    }

    element() {
        return this.container;
    }

    toggle() {

    }

    setNextOverlay(overlay) {
        this.currentOverlay = overlay;
        this.currentIndex += 1;
        
    }
}
