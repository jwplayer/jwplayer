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
            var related = _api.getPlugin('related');
            var nextUp;
            if(related) {
                nextUp = related.controller_.getNextUpItem();
            }

            // Prevent NextUp tooltip button from being aria-hidden="true"
            //Tooltip.call(this, name, ariaText, true);

            //utils.removeClass(this.el, 'jw-hidden');
            // hide initially
            //this.hide();

            this.container = document.createElement('div');
            this.container.className = 'jw-nextup-container jw-background-color jw-reset';
            this.hide();
            this.openClass = 'jw-open';

            this.onPlaylistItem(this._model);
            this.onMediaModel(this._model, this._model.get('mediaModel'));
            this._model.on('change:playlistItem', this.onPlaylistItem, this);
            this._model.on('change:mediaModel', this.onMediaModel, this);
            this._model.on('change:position', this.onElapsed, this);

            new UI(this.nextEl, {'useHover': true, 'directSelect': true})
                .on('click tap', this.click, this)
                .on('over', this.open, this)
                .on('out', this.close, this);

        },
        setNextUpItem : function(item) {
            var element = utils.createElement(nextUpTemplate());
            this.addContent(element);
            this.closeButton = element.getElementsByClassName('jw-nextup-close')[0];
            new UI(this.closeButton)
                .on('click tap', this.close, this);

            new UI(this.content)
                .on('click tap', this.playNext, this);
            // setup thumbnail
            this.img = element.getElementsByClassName('jw-nextup-thumbnail')[0];
            this.image(this.loadThumbnail(item.image));

            // set header
            this.header = element.getElementsByClassName('jw-nextup-header')[0];
            this.header.innerText = this._nextUpText;
            // set title
            this.title = element.getElementsByClassName('jw-nextup-title')[0];
            this.title.innerText = item.title || 'title';
            this.hide(this.closeButton);
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
                console.log('open tooltip');
                this.show();
            }
        },
        close : function (evt) {
            if (evt && evt.currentTarget === this.closeButton || !this.sticky) {
                this.hide();
                console.log('close tooltip');
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
            console.log('open tooltip til end');
        },
        onPlaylistItem : function(model) {
            //var playlist = model.get('playlist');
            var playlistItem = model.get('playlistItem');
            if (playlistItem) {
                this.setNextUpItem(playlistItem);
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

            if (duration - val <= 10) {
                // Show nextup when we're 10s away from the end and not playing an ad
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