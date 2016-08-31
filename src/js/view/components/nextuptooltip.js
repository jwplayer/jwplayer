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

        this.nextUpText = _model.get('localization').nextup;
        this.state = 'tooltip';
        this.relatedMode = false;

        this.setup();
    };

    _.extend(NextUpTooltip.prototype, {
        setup: function() {
            this.container = document.createElement('div');
            this.container.className = 'jw-nextup-container jw-reset';
            var element = utils.createElement(nextUpTemplate());
            this.addContent(element);
            this.hide();

            var relatedBlock = this._model.get('related');

            // Next Up is always shown for playlist items
            this.showNextUp = true;

            // If there are related items, Next Up is shown when we're autoplaying and the timer is set to 0
            if (relatedBlock) {
                this.showNextUp = relatedBlock.oncomplete === 'autoplay' && relatedBlock.autoplaytimer === 0;
            }

            this.reset();
            
            // Events
            this._model.on('change:mediaModel', this.onMediaModel, this);
            this._model.on('change:position', this.onElapsed, this);
            this._api.onPlaylistItem(this.onPlaylistItem.bind(this));

            this.onMediaModel(this._model, this._model.get('mediaModel'));

            // Next button behavior:
            // - click = go to next playlist or related item
            // - hover = show NextUp tooltip without 'close' button
            this.nextButtonUI = new UI(this._nextButton, {'useHover': true, 'directSelect': true})
                .on('click tap', this.click, this)
                .on('over', this.show, this)
                .on('out', this.hide, this);
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

            if (this.relatedMode) {
                this._related.selectItem_(this.nextUpItem, 'interaction');
            } else {
                this._api.playlistNext({reason: 'interaction'});
            }

            this.hide();
        },
        show: function() {
            if (this.state === 'tooltip' || this.state === 'closed') {
                dom.addClass(this.container, 'jw-nextup-container-visible');
            }
        },
        hide: function(evt) {
            // Hovering over the next button should not show/hide NextUp if it is in the opened state
            if (this.state === 'opened' && evt.currentTarget === this._nextButton) {
                return;
            }

            dom.removeClass(this.container, 'jw-nextup-container-visible');
            dom.removeClass(this.container, 'jw-nextup-sticky');

            if (this.state === 'opened') {
                this.state = 'closed';
            }
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
            if (!nextUpItem) {
                this.reset();
                return;
            }

            this.nextUpItem = nextUpItem;

            this.closeButton = this.content.getElementsByClassName('jw-nextup-close')[0];
            this.tooltip = this.content.getElementsByClassName('jw-nextup-tooltip')[0];

            // Events
            this.closeButtonUI = new UI(this.closeButton, {'directSelect': true})
                .on('click tap', this.hide, this);
            this.tooltipUI = new UI(this.tooltip)
                .on('click tap', this.click, this);

            // Setup thumbnail
            this.thumbnail = this.content.getElementsByClassName('jw-nextup-thumbnail')[0];
            dom.toggleClass(this.thumbnail, 'jw-nextup-thumbnail-visible', !!nextUpItem.image);

            if (nextUpItem.image) {
                var thumbnailStyle = this.loadThumbnail(nextUpItem.image);
                utils.style(this.thumbnail, thumbnailStyle);

            }

            // Set header
            this.header = this.content.getElementsByClassName('jw-nextup-header')[0];
            this.header.innerText = this.nextUpText;

            // Set title
            this.title = this.content.getElementsByClassName('jw-nextup-title')[0];
            this.title.innerText = nextUpItem.title || '';

        },
        onPlaylistItem: function(item) {
            // Listen for duration changes to determine the offset
            // for when next up should be shown
            this._model.on('change:duration', this.onDuration, this);

            var playlist = this._model.get('playlist');
            var nextUpIndex = (item.index + 1) % playlist.length;
            var nextUpItem = playlist[nextUpIndex];
            this.relatedMode = false;
            this.setNextUpItem(nextUpItem);

            this._related = this._related || this._api.getPlugin('related');
            if (this._related && item.index === playlist.length - 1) {
                // Only switch to related mode if there is a related playlist
                this._related.on('playlist', this.onRelatedPlaylist.bind(this));
            }
        },
        onDuration: function(model, duration) {
            if (!duration) {
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
            if (evt.playlist && evt.playlist.length) {
                this.relatedMode = true;
                this.setNextUpItem(evt.playlist[0]);
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
