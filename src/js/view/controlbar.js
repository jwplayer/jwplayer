define([
    'utils/helpers',
    'parsers/captions/parsers.srt',
    'utils/underscore',
    'events/events',
    'events/states',
    'utils/backbone.events',
    'view/touch',
    'view/thumbs',
    'view/menu',
    'view/overlay',
    'view/components/slider',
    'view/components/timeslider'
], function(utils, SrtParser, _, events, states,
            Events, Touch, Thumbs, Menu, Overlay, Slider, TimeSlider) {



    function button(icon, click) {
        var element = document.createElement('span');
        element.className = 'jw-icon-inline ' + icon;
        element.style.display = 'none';

        if (click) {
            element.onclick = function() { click(); };
        }

        return {
            element : function() { return element; },
            toggle : function(m) { m ? this.show() : this.hide(); },
            show : function() { element.style.display = '';},
            hide : function() { element.style.display = 'none';}
        };
    }

    function text(name) {
        var element = document.createElement('span');
        element.className = 'jw-text ' + name;
        return element;
    }

    function buildGroup(group, elements) {
        var elem = document.createElement('span');
        elem.className = 'jw-group jw-controlbar--' + group+'-group';

        _.each(elements, function(e) {
            if (e.element) {
                e = e.element();
            }
            elem.appendChild(e);
        });

        return elem;
    }

    function Controlbar(_api, _model) {
        this._api = _api;
        this._model = _model;

        this.setup();
    }

    _.extend(Controlbar.prototype, Events, {

        setup : function() {
            this.build();
            this.initialize();
        },

        build : function() {

            var timeSlider = new TimeSlider(this._model, this._api);
            var volumeSlider = new Slider('jw-volume', 'horizontal');

            this.elements = {
                play: button('jw-playback-toggle-icon', this._api.play),
                prev: button('jw-icon-prev', this._api.playlistPrev),
                next: button('jw-icon-next', this._api.playlistNext),
                elapsed: text('jw-elapsed'),
                time: timeSlider,
                duration: text('jw-duration'),
                hd: button('jw-icon-hd-on'),
                cc: button('jw-icon-cc-on'),
                mute: button('jw-icon-volume-mute', this._api.setMute),
                volume: volumeSlider,
                cast: button('jw-icon-cast-on'),
                fullscreen: button('jw-icon-fullscreen')
            };

            this.layout = {
                left: [
                    this.elements.play,
                    this.elements.prev,
                    this.elements.next,
                    this.elements.elapsed
                ],
                center: [
                    this.elements.time
                ],
                right: [
                    this.elements.duration,
                    this.elements.hd,
                    this.elements.cc,
                    this.elements.mute,
                    this.elements.volume,
                    this.elements.cast,
                    this.elements.fullscreen
                ]
            };

            this.el = document.createElement('span');
            this.el.className = 'jw-controlbar';


            var leftGroup = buildGroup('left', this.layout.left);
            var centerGroup = buildGroup('center', this.layout.center);
            var rightGroup = buildGroup('right', this.layout.right);

            this.el.appendChild(leftGroup);
            this.el.appendChild(centerGroup);
            this.el.appendChild(rightGroup);
        },
        initialize : function() {
            // Initial State
            this.elements.play.show();
            this.elements.fullscreen.show();
            this.elements.mute.show();
            this.onVolume(this._model, this._model.get('volume'));
            this.onPlaylist(this._model, this._model.get('playlist'));
            this.onPlaylistItem(this._model, this._model.get('playlistItem'));
            this.onCastAvailable(this._model, this._model.get('castAvailable'));


            // Listen for model changes
            this._model.on('change:playlist', this.onPlaylist, this);
            this._model.on('change:playlistItem', this.onPlaylistItem, this);
            this._model.on('change:volume', this.onVolume, this);
            this._model.on('change:castAvailable', this.onCastAvailable, this);

            this._model.on('change:duration', function(model, val) {
                this.elements.duration.innerHTML = utils.timeFormat(val);
            }, this);
            this._model.on('change:position', function(model, val) {
                this.elements.elapsed.innerHTML = utils.timeFormat(val);
            }, this);

            // Event listeners
            this.elements.volume.on('update', function(pct) {
                var val = pct.percentage;
                this._api.setVolume(val);
            }, this);

        },

        onPlaylist : function(model, playlist) {
            var display = (playlist.length > 1);
            this.elements.next.toggle(display);
            this.elements.prev.toggle(display);
        },
        onPlaylistItem : function(/*model, item*/) {
            this.elements.time.updateBuffer(0);
            this.elements.time.render(0);
            this.elements.duration.innerHTML = '';
            this.elements.elapsed.innerHTML = '';
        },
        onVolume : function(model, pct) {
            this.elements.volume.render(pct);
        },
        onCastAvailable : function(model, val) {
            this.elements.cast.toggle(val);
        },

        element: function() {
            return this.el;
        },

        redraw : utils.noop,
        adMode : utils.noop,
        hide : utils.noop,
        show : utils.noop,
        audioMode : utils.noop,
        hideFullscreen : utils.noop
    });


    return Controlbar;
});
