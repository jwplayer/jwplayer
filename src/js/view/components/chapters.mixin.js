define([
    'utils/underscore',
    'utils/helpers',
    'parsers/captions/parsers.srt',
], function(_, utils, SrtParser) {

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
                this.pct = this.time;
            } else {
                this.pct = (this.time/duration) * 100;
            }

            this.el.style.left = this.pct + '%';
        }
    });

    var ChaptersMixin = {

        loadChapters: function (file) {
            utils.ajax(file, this.chaptersLoaded.bind(this), this.chaptersFailed, true);
        },

        chaptersLoaded: function (evt) {
            var Srt = new SrtParser();
            var data = Srt.parse(evt.responseText, true);
            if (_.isArray(data)) {
                _.each(data, this.addCue, this);
                this.drawCues();
            }
        },

        chaptersFailed: function () {
        },

        addCue: function (obj) {
            this.cues.push(new Cue(obj.begin, obj.text));
        },

        drawCues: function () {
            // We won't want to draw them until we have a duration
            var duration = this._model.mediaModel.get('duration');
            if (!duration || duration <= 0) {
                this._model.mediaModel.once('change:duration', this.drawCues, this);
                return;
            }

            var _this = this;
            _.each(this.cues, function (cue) {
                cue.align(duration);
                cue.el.addEventListener('mouseover', function () {
                    _this.activeCue = cue;
                });
                cue.el.addEventListener('mouseout', function () {
                    _this.activeCue = null;
                });
                _this.elementRail.appendChild(cue.el);
            });
        },

        reset: function () {
            _.each(this.cues, function (cue) {
                this.elementRail.removeChild(cue.el);
            }, this);
            this.cues = [];
        }
    };

    return ChaptersMixin;
});