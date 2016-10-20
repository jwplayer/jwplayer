define([
    'utils/dom',
    'utils/ui',
    'utils/underscore',
    'utils/helpers',
    'templates/nextup.html'
], function(dom, UI, _, utils, nextUpTemplate) {
    var NextUpTooltip = function(_model, _api, nextButton) {
        this._model = _model;
        this._api = _api;
        this._nextButton = nextButton;

        this.nextUpText = _model.get('localization').nextUp;
        this.state = 'tooltip';
        this.relatedMode = false;
    };

    _.extend(NextUpTooltip.prototype, {
        setup: function() {
            this.container = document.createElement('div');
            this.container.className = 'jw-nextup-container jw-reset';
            var element = utils.createElement(nextUpTemplate());
            this.addContent(element);

            this.closeButton = this.content.querySelector('.jw-nextup-close');
            this.tooltip = this.content.querySelector('.jw-nextup-tooltip');

            // Next Up is always shown for playlist items
            this.showNextUp = true;

            this.reset();
            
            // Events
            this._model.on('change:mediaModel', this.onMediaModel, this);
            this._model.on('change:position', this.onElapsed, this);
            this._model.on('change:playlist', this.onPlaylist, this);
            this._api.onPlaylistItem(this.onPlaylistItem.bind(this));

            this.closeButtonUI = new UI(this.closeButton, {'directSelect': true})
                .on('click tap', this.hide, this);
            this.tooltipUI = new UI(this.tooltip)
                .on('click tap', this.click, this);

            // If there's a related block, wait until the plugin is available
            if (this._model.get('related')) {
                this._api.onReady(this.onReady.bind(this));
            }

            this.onMediaModel(this._model, this._model.get('mediaModel'));

            // Next button behavior:
            // - click = go to next playlist or related item
            // - hover = show NextUp tooltip without 'close' button
            this.nextButtonUI = new UI(this._nextButton.element(), {'useHover': true, 'directSelect': true})
                .on('click tap', this.click, this)
                .on('over', this.show, this)
                .on('out', this.hoverOut, this);
        },
        loadThumbnail : function(url) {
            var style = {};
            this.nextUpImage = new Image();
            this.nextUpImage.onload = (function() {
                this.nextUpImage.onload = null;
            }).bind(this);
            this.nextUpImage.src = url;

            style.backgroundImage = 'url("' + url + '")';
            return style;
        },
        click: function() {
            this.state = 'tooltip';

            if (this.relatedMode && this._related.selectItem_) {
                 this._related.selectItem_(this.nextUpItem, 'interaction');
            } else if (!this.relatedMode) {
                this._api.playlistNext({reason: 'interaction'});
            }

            this.hide();
        },
        show: function() {
            if(this.state === 'opened') {
                return;
            }

            dom.addClass(this.container, 'jw-nextup-container-visible');
        },
        hide: function() {
            dom.removeClass(this.container, 'jw-nextup-container-visible');
            dom.removeClass(this.container, 'jw-nextup-sticky');

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
            this._model.off('change:position', this.onElapsed, this);

            if (!nextUpItem) {
                this.showNextUp = false;
                this._nextButton.toggle(false);
                this._model.off('change:duration', this.onDuration, this);
                return;
            }

            this.nextUpItem = nextUpItem;

            this._model.on('change:position', this.onElapsed, this);

            var _this = this;

            // Give the previous item time to complete its animation
            setTimeout(function () {
                // Setup thumbnail
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
        onReady: function() {
            this._related = this._api.getPlugin('related');
            // Only switch to related mode if there is a related playlist
            this._related.on('playlist', this.onRelatedPlaylist.bind(this));
        },
        onPlaylist: function(model, playlist) {
            this._playlist = playlist;
            this.showNextUp = (playlist.length > 1);
            this.relatedMode = false;

            this._nextButton.toggle(this.showNextUp);
        },
        onPlaylistItem: function(item) {
            this._model.off('change:duration', this.onDuration, this);

            if(!this.showNextUp) {
                return;
            }

            // Listen for duration changes to determine the offset
            // for when next up should be shown
            this._model.on('change:duration', this.onDuration, this);

            var nextUpIndex = (item.index + 1) % this._playlist.length;
            var nextUpItem = this._playlist[nextUpIndex];

            this.setNextUpItem(nextUpItem);
        },
        onDuration: function(model, duration) {
            if (!duration) {
                return;
            }

            if (utils.adaptiveType(duration) === 'LIVE' || utils.adaptiveType(duration) === 'DVR') {
                model.off('change:duration', this.onDuration, this);
                return;
            }

            // Use nextupoffset if set or default to 10 seconds from the end of playback
            var offset = model.get('nextupoffset') || -10;
            offset = utils.seconds(offset);

            if (offset < 0) {
                // Determine offset from the end. Duration may change.
                offset += duration;
            } else {
                // Offset is from the beginning of playback.
                // No need to listen for further duration changes.
                model.off('change:duration', this.onDuration, this);
            }

            this.offset = offset;
        },
        onRelatedPlaylist: function(evt) {
            var playlist = evt.playlist;
            if (playlist && playlist.length) {
                this.relatedMode = true;
                var relatedBlock = this._model.get('related');
                // If there are related items, Next Up is shown when we're autoplaying and the timer is set to 0
                this.showNextUp = relatedBlock.oncomplete === 'autoplay' && relatedBlock.autoplaytimer === 0;

                // Show the next button when there is related content
                this._nextButton.toggle(true);

                var nextUpItem = this._related.nextUp && this._related.nextUp();

                this.setNextUpItem(nextUpItem);

                this._model.on('change:duration', this.onDuration, this);
            }
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
            if (this.showNextUp && (val >= this.offset)) {
                this.showTilEnd();
            } else if (this.state === 'opened' || this.state === 'closed') {
                this.state = 'tooltip';
                this.hide();
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
            this._model.off('change:duration', this.onDuration, this);
            this._model.off('change:mediaModel', this.onMediaModel, this);
            this._model.off('change:position', this.onElapsed, this);

            if (this.nextButtonUI) {
                this.nextButtonUI.off();
            }

            if (this.closeButtonUI) {
                this.closeButtonUI.off();
            }

            if (this.tooltipUI) {
                this.tooltipUI.off();
            }
        }
    });

    return NextUpTooltip;
});
