define([
    'utils/ui',
    'view/components/tooltip',
    'utils/helpers',
    'templates/nextup.html'
], function(UI, Tooltip, utils, nextUpTemplate) {
    var NextUpTooltip = Tooltip.extend({
        'constructor' : function(_model, _api, nextEl, ariaText) {
            this._model = _model;
            this._api = _api;
            this.sticky = false;
            this.nextEl = nextEl;
            this._nextUpText = ariaText || 'Next Up';

            this.container = document.createElement('div');
            this.container.className = 'jw-nextup-container jw-background-color jw-reset';
            this.hide();
            this.openClass = 'jw-open';

            this.onMediaModel(this._model, this._model.get('mediaModel'));
            this._api.onPlaylistItem(this.onPlaylistItem.bind(this));
            this._model.on('change:mediaModel', this.onMediaModel, this);
            this._model.on('change:position', this.onElapsed, this);

            new UI(this.nextEl, {'useHover': true, 'directSelect': true})
                .on('click tap', this.click, this)
                .on('over', this.open, this)
                .on('out', this.close, this);

        },
        loadThumbnail : function(url) {
            var style = {
                display: 'block',
                margin: '0 auto',
                backgroundPosition: '0 0',
                width: '30px',
                height: '20px'
            };
            this.nextUpImage = new Image();
            this.nextUpImage.onload = (function () {
                this.nextUpImage.onload = null;
            }).bind(this);
            this.nextUpImage.src = url;

            style.backgroundImage = 'url("' + url + '")';
            return style;
        },
        image : function(style) {
            utils.style(this.img, style);
        },
        click : function() {
            //this.trigger('click');
            this.sticky = false;
            this._api.playlistNext({reason: 'interaction'});

            this.close();
        },
        show : function(el) {
            el = el || this.container;
            el.style.display = '';
        },
        hide : function(el) {
            el = el || this.container;
            el.style.display = 'none';
        },
        toggle : function(m, el) {
            if (m) {
                this.show(el);
            } else {
                this.hide(el);
            }
        },
        open : function () {
            if (!this.sticky) {
                this.show();
            }
        },
        close : function (evt) {
            if (evt && evt.currentTarget === this.closeButton || !this.sticky) {
                this.hide();
            }
        },
        showTilEnd : function() {
            // show next up til playback ends
            // don't hide even when controlbar is idle
            if (this.sticky) {
                return;
            }
            this.show(this.closeButton);
            this.content.className = 'jw-nextup jw-reset jw-nextup-sticky';
            this.open();
            this.sticky = true;
        },
        onPlaylistItem : function(item) {
            var playlist = this._model.get('playlist');
            var nextUpIndex = (item.index + 1) % playlist.length;
            var nextUpItem = playlist[nextUpIndex];

            this._related = this._related || this._api.getPlugin('related');
            if(this._related && item.index === playlist.length - 1) {
                this._related.on('playlist', this.onRelatedPlaylist.bind(this));
            } else {
                this.setNextUpItem(nextUpItem);
            }
        },
        setNextUpItem : function(nextUpItem) {
            var element = utils.createElement(nextUpTemplate());
            this.addContent(element);
            this.closeButton = element.getElementsByClassName('jw-nextup-close')[0];
            new UI(this.closeButton)
                .on('click tap', this.close, this);

            new UI(this.content)
                .on('click tap', this.playNext, this);
            // setup thumbnail
            this.img = element.getElementsByClassName('jw-nextup-thumbnail')[0];
            this.image(this.loadThumbnail(nextUpItem.image));

            // set header
            this.header = element.getElementsByClassName('jw-nextup-header')[0];
            this.header.innerText = this._nextUpText;
            // set title
            this.title = element.getElementsByClassName('jw-nextup-title')[0];
            this.title.innerText = nextUpItem.title || 'title';
            this.hide(this.closeButton);
        },
        onRelatedPlaylist : function(evt) {
            if (evt.playlist && evt.playlist.length) {
                this.setNextUpItem(evt.playlist[0]);
            }
        },
        onMediaModel : function (model, mediaModel) {
            mediaModel.on('change:state', function(model, state) {
                if(state === 'complete') {
                    this.sticky = false;
                    this.close();
                }
            }, this);
        },
        onElapsed : function(model, val) {
            var duration = model.get('duration');
            var relatedConfig = model.get('related');
            var showNextUp = true;
            if(relatedConfig) {
                var autoplayTimer = relatedConfig.autoplaytimer;
                var oncomplete = relatedConfig.oncomplete;
                showNextUp = oncomplete === 'autoplay' && autoplayTimer === 0;
            }

            // Show nextup 10s from completion if:
            // - we're in playlist mode but not playing an ad
            // - we're autplaying in related mode and autoplaytimer is set to 0
            if (showNextUp && (duration - val <= 10)) {
                this.showTilEnd();
            }
        },
        element : function () {
            return this.container;
        },
        addContent : function (elem) {
            if(this.content){
                this.removeContent();
            }

            this.content = elem;
            this.container.appendChild(elem);
        },
        removeContent : function(){
            if(this.content) {
                this.container.removeChild(this.content);
                this.content = null;
            }
        },
        playNext : function(evt) {
            this.close(evt);
            this._api.playlistNext();
        }
    });

    return NextUpTooltip;
});