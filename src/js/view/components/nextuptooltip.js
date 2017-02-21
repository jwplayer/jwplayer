define([
    'utils/dom',
    'utils/ui',
    'utils/underscore',
    'utils/helpers',
    'templates/nextup.html'
], function(dom, UI, _, utils, nextUpTemplate) {
    var NextUpTooltip = function(_model, _api, playerElement) {
        this._model = _model;
        this._api = _api;
        this._playerElement = playerElement;
        this.nextUpText = _model.get('localization').nextUp;
        this.nextUpClose = _model.get('localization').nextUpClose;
        this.state = 'tooltip';
    };

    _.extend(NextUpTooltip.prototype, {
        setup: function() {
            this.container = document.createElement('div');
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
            new UI(this.closeButton, {'directSelect': true})
                .on('click tap', function() {
                    model.set('nextUpSticky', false);
                    model.set('nextUpVisible', false);
                }, this);
            // Tooltip
            new UI(this.tooltip)
                .on('click tap', this.click, this);
        },
        loadThumbnail : function(url) {
            this.nextUpImage = new Image();
            this.nextUpImage.onload = (function() {
                this.nextUpImage.onload = null;
            }).bind(this);
            this.nextUpImage.src = url;

            return {
                backgroundImage: 'url("' + url + '")'
            };
        },
        click: function() {
            this.reset();
            this._api.next();
        },
        toggle: function(model, show) {
            show = !!show;

            if (!model.get('nextUpEnabled')) {
                return;
            }

            dom.toggleClass(this.container, 'jw-nextup-container-visible', show);
            dom.toggleClass(this._playerElement, 'jw-flag-nextup', show);
            dom.toggleClass(this.container, 'jw-nextup-sticky', !!model.get('nextUpSticky'));
        },
        setNextUpItem: function(nextUpItem) {
            var _this = this;
            // Give the previous item time to complete its animation
            setTimeout(function () {
                // Set thumbnail
                _this.thumbnail = _this.content.querySelector('.jw-nextup-thumbnail');
                dom.toggleClass(_this.thumbnail, 'jw-nextup-thumbnail-visible', !!nextUpItem.image);
                if (nextUpItem.image) {
                    var thumbnailStyle = _this.loadThumbnail(nextUpItem.image);
                    utils.style(_this.thumbnail, thumbnailStyle);
                }

                // Set header
                _this.header = _this.content.querySelector('.jw-nextup-header');
                _this.header.innerText = _this.nextUpText;

                // Set title
                _this.title = _this.content.querySelector('.jw-nextup-title');
                var title = nextUpItem.title;
                _this.title.innerText = title ? utils.createElement(title).textContent : '';
            }, 500);
        },
        onNextUp: function(model, nextUp) {
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
        },
        onDuration: function(model, duration) {
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
        },
        onMediaModel: function(model, mediaModel) {
            var _this = this;
            mediaModel.on('change:state', function(model, state) {
                if (state === 'complete') {
                    _this.reset();
                }
            });
        },
        onElapsed: function(model, val) {
            if (!model.get('nextUpEnabled') || model.get('nextUpSticky') === false) {
                return;
            }
            // Show nextup during VOD streams if:
            // - in playlist mode but not playing an ad
            // - autoplaying in related mode and autoplaytimer is set to 0
            var showTilEnd = val >= this.offset;
            if (showTilEnd) {
                model.set('nextUpVisible', showTilEnd);
                model.set('nextUpSticky', showTilEnd);
            }
        },
        onStreamType: function(model, streamType) {
            if (streamType !== 'VOD') {
                model.set('nextUpSticky', false);
            }
        },
        element: function() {
            return this.container;
        },
        addContent: function(elem) {
            if (this.content) {
                this.removeContent();
            }
            this.content = elem;
            this.container.appendChild(elem);
        },
        removeContent: function() {
            if (this.content) {
                this.container.removeChild(this.content);
                this.content = null;
            }
        },
        reset: function() {
            var model = this._model;
            model.set('nextUpVisible', false);
            model.set('nextUpSticky', null);
        }
    });

    return NextUpTooltip;
});
