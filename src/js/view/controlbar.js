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

        if (click) {
            element.onclick = function() { click(); };
        }

        return element;
    }

    function text(name) {
        var element = document.createElement('span');
        element.className = 'jw-text ' + name;
        return element;
    }

    function slider(name, vert) {
        var orientation = vert ? 'vertical' : 'horizontal';
        var sl = new Slider(name, orientation);
        return sl;
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
            this.elements = {
                play: button('jw-playback-toggle-icon', this._api.play),
                prev: button('jw-icon-prev', this._api.playlistPrev),
                next: button('jw-icon-next', this._api.playlistNext),
                elapsed: text('jw-elapsed'),
                time: TimeSlider(this._model, this._api),
                duration: text('jw-duration'),
                hd: button('jw-icon-hd-on'),
                cc: button('jw-icon-cc-on'),
                mute: button('jw-icon-volume-mute', this._api.setMute),
                volume: slider('jw-volume'),
                cast: button('jw-icon-cast-on'),
                fullscreen: button('jw-icon-fullscreen')
            };

            this.layout = {
                left : [
                    this.elements.play,
                    this.elements.prev,
                    this.elements.next,
                    this.elements.elapsed
                ],
                center : [
                    this.elements.time,
                ],
                right : [
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

            this._model.on('change:volume', function(model, pct) {
                this.elements.volume.update(pct);
            }, this);
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
