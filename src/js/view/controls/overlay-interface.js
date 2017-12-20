import overlayTemplate from 'view/controls/templates/overlay-interface';
import { toggleClass } from 'utils/dom';
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
        this.overlays = [];
        this.currentOverlay = null;
        this.currentIndex = 0;
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
                this.currentOverlay.closed = true;
            }, this);
        // Tooltip
        new UI(this.tooltip)
            .on('click tap', this.click, this); 

        this.setOverlay(this.overlays[this.currentIndex]);
    }

    loadThumbnail(url) {
        this.nextUpImage = new Image();
        this.nextUpImage.onload = (function () {
            this.nextUpImage.onload = null;
        }).bind(this);
        this.nextUpImage.src = url;

        return {
            backgroundImage: 'url("' + url + '")'
        };
    }

    onPlaylistItem(model, playlistItem) {
        this.toggle(false);

        if (!playlistItem.overlay) {
            return;
        }

        this.overlays = playlistItem.overlay;
        this.currentIndex = 0;
        this.setOverlay(this.overlays[this.currentIndex]);
    }   

    onPosition(model, position) {
        if (!this.currentOverlay || model.get('state') !== 'playing') {
            return;
        }
        position = Math.round(position);

        if (position > this.currentOverlay.showAt && position < this.currentOverlay.endAt) {
            if (this.currentOverlay.closed === true) {
                return;
            }
            this.toggle(true);
        } else if (position > this.currentOverlay.endAt) {
            this.toggle(false);
            this.currentOverlay = this.overlays[this.currentIndex];
            this.setOverlay(this.currentOverlay);
        }
    }

    click() {
        const action = this.currentOverlay.action;
        if (typeof action === 'function') {
            this.currentOverlay.action(this._api);
        } else if (typeof action === 'string') {
            this._api.pause();
            window.open(action, '_blank');
        }

        if (this.currentOverlay.closeOnCLick === true) {
            this.toggle(false);
            this.currentOverlay.closed = true;
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

    toggle(show) {
        if (this.showing === show) {
            return;
        } else if (show) {
            toggleClass(this.container, 'jw-interface-container-visible');
            this.showing = true;
        } else if (!show) {
            toggleClass(this.container, 'jw-interface-container-visible');
            this.showing = false;
        }
    }

    setOverlay(overlay) {
        setTimeout(() => {
            this.currentOverlay = overlay;
            this.currentIndex += 1;

            // set thumbnail if its on overlay config
            this.thumbnail = this.content.querySelector('.jw-interface-thumbnail');
            toggleClass(this.content, 'jw-interface-thumbnail-visible', !!overlay.image);

            if (overlay.image) {
                const thumbnailStyle = this.loadThumbnail(overlay.image);
                utils.style(this.thumbnail, thumbnailStyle);
            }

            // set description
            this.description = this.content.querySelector('.jw-interface-description');
            const description = overlay.description;
            this.description.innerText = description ? utils.createElement(description).textContent : '';
        }, 500);
    }
}

