define([
    'utils/dom',
    'utils/ui',
    'utils/underscore',
    'utils/helpers',
    'templates/nextup.html'
], function(dom, UI, _, utils, nextUpTemplate) {
    var NextUpTooltip = function(_model, _api, nextButton, playerElement) {
        this._model = _model;
        this._api = _api;
        this._nextButton = nextButton;
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

            // Next Up is hidden until we get a valid NextUp item from the nextUp event
            this.showNextUp = false;
            this.streamType = undefined;

            // Events
            this._model.on('change:mediaModel', this.onMediaModel, this);
            this._model.on('change:streamType', this.onStreamType, this);
            this._model.on('change:nextUp', this.onNextUp, this);

            // Listen for duration changes to determine the offset from the end for when next up should be shown
            this._model.on('change:duration', this.onDuration, this);
            // Listen for position changes so we can show the tooltip when the offset has been crossed
            this._model.on('change:position', this.onElapsed, this);

            this.onMediaModel(this._model, this._model.get('mediaModel'));

            // Close button
            new UI(this.closeButton, {'directSelect': true})
                .on('click tap', this.hide, this);
            // Tooltip
            new UI(this.tooltip)
                .on('click tap', this.click, this);
            // Next button behavior:
            // - click = go to next playlist or related item
            // - hover = show NextUp tooltip without 'close' button
            new UI(this._nextButton.element(), {'useHover': true, 'directSelect': true})
                .on('click tap', this.click, this)
                .on('over', this.show, this)
                .on('out', this.hoverOut, this);
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
            this.state = 'tooltip';
            this._api.next();
            this.hide();
        },
        show: function() {
            if(this.state === 'opened' || this.hideToolTip) {
                return;
            }
            dom.addClass(this.container, 'jw-nextup-container-visible');
            dom.addClass(this._playerElement, 'jw-flag-nextup');
        },
        hide: function() {
            dom.removeClass(this.container, 'jw-nextup-container-visible');
            dom.removeClass(this.container, 'jw-nextup-sticky');
            dom.removeClass(this._playerElement, 'jw-flag-nextup');

            if (this.state === 'opened') {
                this.state = 'closed';
            }
        },
        hoverOut: function() {
            if (this.state === 'opened') {
                // Moving the pointer away from the next button should not show/hide NextUp if it is 'opened'
                return;
            }
            this.hide();
        },
        showTilEnd: function() {
            // Show next up til playback ends. Don't hide even when controlbar is idle
            if (this.state === 'opened' || this.state === 'closed') {
                return;
            }
            dom.addClass(this.container, 'jw-nextup-sticky');
            this.show();
            this.state = 'opened';
        },
        setNextUpItem: function(nextUpItem) {
            var _this = this;
            // Give the previous item time to complete its animation
            setTimeout(function () {
                // hide the tooltip if we don't have a title or a thumbnail image
                _this.hideToolTip = !(nextUpItem.title || nextUpItem.image);

                if(_this.hideToolTip) {
                    return;
                }
                
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
            if (!nextUp) {
                this._nextButton.toggle(false);
                this.showNextUp = false;
                return;
            }
            this.showNextUp = nextUp.showNextUp;
            this._nextButton.toggle(true);
            this.setNextUpItem(nextUp);
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
            mediaModel.on('change:state', function(model, state) {
                if (state === 'complete') {
                    this.state = 'tooltip';
                    this.hide();
                }
            }, this);
        },
        onElapsed: function(model, val) {
            // Show nextup if:
            // - in playlist mode but not playing an ad
            // - autoplaying in related mode and autoplaytimer is set to 0
            // - not a live stream ('Live' or 'DVR')
            if (this.streamType === 'VOD' && this.showNextUp && (val >= this.offset)) {
                this.showTilEnd();
            } else if (this.state === 'opened' || this.state === 'closed') {
                this.state = 'tooltip';
                this.hide();
            }
        },
        onStreamType: function(model, streamType) {
            this.streamType = streamType;
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
        }
    });

    return NextUpTooltip;
});
