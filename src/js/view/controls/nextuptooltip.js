define([
    'utils/dom',
    'utils/ui',
    'utils/helpers',
    'templates/nextup.html'
], function(dom, UI, utils, nextUpTemplate) {

    return class NextUpTooltip {
        constructor(_model, _api, playerElement) {
            this._model = _model;
            this._api = _api;
            this._playerElement = playerElement;
            this.nextUpText = _model.get('localization').nextUp;
            this.nextUpClose = _model.get('localization').nextUpClose;
            this.state = 'tooltip';
        }

        setup(context) {
            this.container = context.createElement('div');
            this.container.className = 'jw-nextup-container jw-reset';
            var element = utils.createElement(nextUpTemplate());
            this.addContent(element);

            this.closeButton = this.content.querySelector('.jw-nextup-close');
            this.closeButton.setAttribute('aria-label', this.nextUpClose);
            this.tooltip = this.content.querySelector('.jw-nextup-tooltip');

            var model = this._model;
            // Next Up is hidden until we get a valid NextUp item from the nextUp event
            model.set('nextUpEnabled', false);

            // Events
            model.on('change:mediaModel', this.onMediaModel, this);
            model.on('change:streamType', this.onStreamType, this);
            model.on('change:nextUp', this.onNextUp, this);
            model.on('change:nextUpVisible', this.toggle, this);
            model.on('change:nextUpSticky', this.toggle, this);

            // Listen for duration changes to determine the offset from the end for when next up should be shown
            model.on('change:duration', this.onDuration, this);
            // Listen for position changes so we can show the tooltip when the offset has been crossed
            model.on('change:position', this.onElapsed, this);

            this.onMediaModel(model, model.get('mediaModel'));

            // Close button
            new UI(this.closeButton, { directSelect: true })
                .on('click tap', function() {
                    model.set('nextUpSticky', false);
                    model.set('nextUpVisible', false);
                }, this);
            // Tooltip
            new UI(this.tooltip)
                .on('click tap', this.click, this);
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

        toggle(model, show) {
            show = !!show;

            if (!model.get('nextUpEnabled')) {
                return;
            }

            dom.toggleClass(this.container, 'jw-nextup-container-visible', show);
            dom.toggleClass(this._playerElement, 'jw-flag-nextup', show);
            dom.toggleClass(this.container, 'jw-nextup-sticky', !!model.get('nextUpSticky'));
        }

        setNextUpItem(nextUpItem) {
            // Give the previous item time to complete its animation
            setTimeout(() => {
                // Set thumbnail
                this.thumbnail = this.content.querySelector('.jw-nextup-thumbnail');
                dom.toggleClass(this.thumbnail, 'jw-nextup-thumbnail-visible', !!nextUpItem.image);
                if (nextUpItem.image) {
                    var thumbnailStyle = this.loadThumbnail(nextUpItem.image);
                    utils.style(this.thumbnail, thumbnailStyle);
                }

                // Set header
                this.header = this.content.querySelector('.jw-nextup-header');
                this.header.innerText = this.nextUpText;

                // Set title
                this.title = this.content.querySelector('.jw-nextup-title');
                var title = nextUpItem.title;
                this.title.innerText = title ? utils.createElement(title).textContent : '';
            }, 500);
        }

        onNextUp(model, nextUp) {
            this.reset();
            if (!nextUp) {
                return;
            }

            var nextUpEnabled = !!(nextUp.title || nextUp.image);
            model.set('nextUpEnabled', nextUpEnabled);

            if (nextUpEnabled) {
                if (!nextUp.showNextUp) {
                    // The related plugin will countdown the nextUp item
                    model.set('nextUpSticky', false);
                }
                this.setNextUpItem(nextUp);
            }
        }

        onDuration(model, duration) {
            if (!duration) {
                return;
            }

            // Use nextupoffset if set or default to 10 seconds from the end of playback
            var offset = utils.seconds(model.get('nextupoffset') || -10);
            if (offset < 0) {
                // Determine offset from the end. Duration may change.
                offset += duration;
            }

            this.offset = offset;
        }

        onMediaModel(model, mediaModel) {
            mediaModel.on('change:state', function(stateChangeMediaModel, state) {
                if (state === 'complete') {
                    model.set('nextUpVisible', false);
                }
            });
        }

        onElapsed(model, val) {
            var nextUpSticky = model.get('nextUpSticky');
            if (!model.get('nextUpEnabled') || nextUpSticky === false) {
                return;
            }
            // Show nextup during VOD streams if:
            // - in playlist mode but not playing an ad
            // - autoplaying in related mode and autoplaytimer is set to 0
            var showTilEnd = val >= this.offset;
            if (showTilEnd && nextUpSticky === undefined) { // show if nextUpSticky is unset
                model.set('nextUpVisible', showTilEnd);
                model.set('nextUpSticky', showTilEnd);
            } else if (!showTilEnd && nextUpSticky === true) { // reset if there was a backward seek
                this.reset();
            }
        }

        onStreamType(model, streamType) {
            if (streamType !== 'VOD') {
                model.set('nextUpSticky', false);
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
            var model = this._model;
            model.set('nextUpVisible', false);
            model.set('nextUpSticky', undefined);
        }
    };
});
