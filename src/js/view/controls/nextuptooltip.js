import nextUpTemplate from 'view/controls/templates/nextup';
import { style } from 'utils/css';
import { createElement, toggleClass } from 'utils/dom';
import UI from 'utils/ui';
import Events from 'utils/backbone.events';
import { cloneIcon } from 'view/controls/icons';
import { seconds } from 'utils/strings';

export default class NextUpTooltip {
    constructor(_model, _api, playerElement) {
        Object.assign(this, Events);
        this._model = _model;
        this._api = _api;
        this._playerElement = playerElement;
        this.nextUpText = _model.get('localization').nextUp;
        this.nextUpClose = _model.get('localization').nextUpClose;
        this.state = 'tooltip';
        this.enabled = false;
        this.shown = false;
        this.reset();
    }

    setup(context) {
        this.container = context.createElement('div');
        this.container.className = 'jw-nextup-container jw-reset';
        const element = createElement(nextUpTemplate());
        element.querySelector('.jw-nextup-close').appendChild(cloneIcon('close'));
        this.addContent(element);

        this.closeButton = this.content.querySelector('.jw-nextup-close');
        this.closeButton.setAttribute('aria-label', this.nextUpClose);
        this.tooltip = this.content.querySelector('.jw-nextup-tooltip');

        const viewModel = this._model;
        const playerViewModel = viewModel.player;
        // Next Up is hidden until we get a valid NextUp item from the nextUp event
        this.enabled = false;

        // Events
        viewModel.on('change:nextUp', this.onNextUp, this);

        // Listen for duration changes to determine the offset from the end for when next up should be shown
        playerViewModel.change('duration', this.onDuration, this);
        // Listen for position changes so we can show the tooltip when the offset has been crossed
        playerViewModel.change('position', this.onElapsed, this);

        playerViewModel.change('streamType', this.onStreamType, this);

        playerViewModel.change('state', function(stateChangeModel, state) {
            if (state === 'complete') {
                this.toggle(false);
            }
        }, this);

        // Close button
        new UI(this.closeButton, { directSelect: true }).on('click tap enter', function() {
            this.nextUpSticky = false;
            this.toggle(false);
        }, this);
        // Tooltip
        new UI(this.tooltip).on('click tap', this.click, this);
    }

    loadThumbnail(url) {
        this.nextUpImage = new Image();
        this.nextUpImage.onload = (function() {
            this.nextUpImage.onload = null;
        }).bind(this);
        this.nextUpImage.src = url;

        return {
            backgroundImage: 'url("' + url + '")'
        };
    }

    click() {
        this.reset();
        this._api.next();
    }

    toggle(show, reason) {
        if (!this.enabled) {
            return;
        }
        toggleClass(this.container, 'jw-nextup-sticky', !!this.nextUpSticky);
        if (this.shown !== show) {
            this.shown = show;
            toggleClass(this.container, 'jw-nextup-container-visible', show);
            toggleClass(this._playerElement, 'jw-flag-nextup', show);
            const nextUp = this._model.get('nextUp');
            if (show && nextUp) {
                this.trigger('nextShown', {
                    mode: nextUp.mode,
                    ui: 'nextup',
                    itemsShown: [ nextUp ],
                    feedData: nextUp.feedData,
                    reason: reason,
                });
            }
        }
    }

    setNextUpItem(nextUpItem) {
        // Give the previous item time to complete its animation
        setTimeout(() => {
            // Set thumbnail
            this.thumbnail = this.content.querySelector('.jw-nextup-thumbnail');
            toggleClass(this.content, 'jw-nextup-thumbnail-visible', !!nextUpItem.image);
            if (nextUpItem.image) {
                const thumbnailStyle = this.loadThumbnail(nextUpItem.image);
                style(this.thumbnail, thumbnailStyle);
            }

            // Set header
            this.header = this.content.querySelector('.jw-nextup-header');
            this.header.innerText = this.nextUpText;

            // Set title
            this.title = this.content.querySelector('.jw-nextup-title');
            const title = nextUpItem.title;
            this.title.innerText = title ? createElement(title).textContent : '';

            // Set duration
            if (nextUpItem.duration) {
                this.duration = this.content.querySelector('.jw-nextup-duration');
                const duration = nextUpItem.duration;
                this.duration.innerText = duration ? createElement(duration).textContent : '';
            }

        }, 500);
    }

    onNextUp(model, nextUp) {
        this.reset();
        if (!nextUp) {
            return;
        }

        this.enabled = !!(nextUp.title || nextUp.image);

        if (this.enabled) {
            if (!nextUp.showNextUp) {
                // The related plugin will countdown the nextUp item
                this.nextUpSticky = false;
                this.toggle(false);
            }
            this.setNextUpItem(nextUp);
        }
    }

    onDuration(model, duration) {
        if (!duration) {
            return;
        }

        // Use nextupoffset if set or default to 10 seconds from the end of playback
        let offset = seconds(model.get('nextupoffset') || -10);
        if (offset < 0) {
            // Determine offset from the end. Duration may change.
            offset += duration;
        }

        this.offset = offset;
    }

    onElapsed(model, val) {
        const nextUpSticky = this.nextUpSticky;
        if (!this.enabled || nextUpSticky === false) {
            return;
        }
        // Show nextup during VOD streams if:
        // - in playlist mode but not playing an ad
        // - autoplaying in related mode and autoplaytimer is set to 0
        const showUntilEnd = val >= this.offset;
        if (showUntilEnd && nextUpSticky === undefined) { // show if nextUpSticky is unset
            this.nextUpSticky = showUntilEnd;
            this.toggle(showUntilEnd, 'time');
        } else if (!showUntilEnd && nextUpSticky) { // reset if there was a backward seek
            this.reset();
        }
    }

    onStreamType(model, streamType) {
        if (streamType !== 'VOD') {
            this.nextUpSticky = false;
            this.toggle(false);
        }
    }

    element() {
        return this.container;
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

    reset() {
        this.nextUpSticky = undefined;
        this.toggle(false);
    }

    destroy() {
        this.off();
        this._model.off(null, null, this);
    }
}
