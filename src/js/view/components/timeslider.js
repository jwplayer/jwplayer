define([
    'utils/underscore',
    'view/components/slider',
    'utils/helpers',
    'parsers/captions/parsers.srt',
], function(_, Slider, utils, SrtParser) {

    function Cue(time, text) {
        this.time = time;
        this.text = text;
        this.el = document.createElement('span');

        this.el.className = 'jw-cue';
    }

    _.extend(Cue.prototype, {
        align : function(duration) {
            // If a percentage, use it, else calculate the percentage
            if (this.time.toString().slice(-1) === '%') {
                this.el.style.left = this.time;
            } else {
                var pct = (this.time/duration) * 100;
                this.el.style.left = pct + '%';
            }
        }
    });

    var TimeSlider = Slider.extend({
        constructor : function(_model, _api) {
            this._model = _model;
            this._api = _api;

            // Store the attempted seek, until the previous one completes
            this.seekThrottled = _.throttle(this.performSeek, 400);

            this._model
                .on('change:playlistItem', this.onPlaylistItem, this)
                .on('change:position', this.onPosition, this)
                .on('change:buffer', this.onBuffer, this);

            _api.on('seeked', this.onSeeked, this);

            // Call "super"
            Slider.call(this, 'jw-time', 'horizontal');
        },

        // These overwrite Slider methods
        update: function(pct) {
            this.seekTo = pct;
            this.seekThrottled();
            Slider.prototype.update.apply(this, arguments);
        },
        dragStart : function() {
            this._model.set('scrubbing', true);
            Slider.prototype.dragStart.apply(this, arguments);
        },
        dragEnd : function() {
            this._model.set('scrubbing', false);
            Slider.prototype.dragEnd.apply(this, arguments);
        },

        onSeeked : function () {
            // When we are done scrubbing there will be a final seeked event
            if (this._model.get('scrubbing')) {
                this.performSeek();
            }
        },
        onBuffer : function (model, pct) {
            this.updateBuffer(pct);
        },
        onPosition : function(model, pos) {
            var pct = pos / this._api.getDuration() * 100;
            this.render(pct);
        },
        onPlaylistItem : function (model, playlistItem) {
            this.reset();
            var tracks = playlistItem.tracks;
            _.each(tracks, function (track) {
                if (track && track.kind && track.kind.toLowerCase() === 'thumbnails') {
                    this.loadThumbnails(track.file);
                }
                else if (track && track.kind && track.kind.toLowerCase() === 'chapters') {
                    this.loadChapters(track.file);
                }
            }, this);
        },

        // These are new methods
        performSeek : function () {
            var duration = this._model.get('duration');
            if (duration <= 0) {
                this._api.play();
            } else {
                var position = this.seekTo / 100 * this._api.getDuration();
                this._api.seek(position);
            }
        },

        loadChapters : function(file) {
            utils.ajax(file, this.chaptersLoaded.bind(this), this.chaptersFailed, true);
        },
        chaptersLoaded : function(evt) {
            var Srt = new SrtParser();
            var data = Srt.parse(evt.responseText, true);
            if (_.isArray(data)) {
                _.each(data, this.addCue, this);
                this.drawCues();
            }
        },
        chaptersFailed : function() {},
        addCue : function(obj) {
            // Obj { begin, end, text }
            this.cues.push(new Cue(obj.begin, obj.text));

        },
        drawCues : function() {
            // We won't want to draw them until we have a duration
            var duration = this._model.mediaModel.get('duration');
            if (!duration || duration <= 0) {
                this._model.mediaModel.once('change:duration', this.drawCues, this);
                return;
            }

            _.each(this.cues, function(cue) {
                cue.align(duration);
                this.elementRail.appendChild(cue.el);
            }, this);
        },
        reset : function() {
            _.each(this.cues, function(cue) {
                this.elementRail.removeChild(cue.el);
            }, this);
            this.cues = [];
        }

        //loadThumbnails : function(file) {},
    });


    return TimeSlider;
});
