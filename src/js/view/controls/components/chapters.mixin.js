define([
    'utils/underscore',
    'utils/helpers',
    'parsers/captions/srt',
], function(_, utils, srt) {

    class Cue {

        constructor (time, text) {
            this.time = time;
            this.text = text;
            this.el = document.createElement('div');
            this.el.className = 'jw-cue jw-reset';
        }

        align(duration) {
            // If a percentage, use it, else calculate the percentage
            if (this.time.toString().slice(-1) === '%') {
                this.pct = this.time;
            } else {
                const percentage = (this.time / duration) * 100;
                this.pct = percentage + '%';
            }

            this.el.style.left = this.pct;
        }
    }

    return {

        loadChapters: function (file) {
            utils.ajax(file, this.chaptersLoaded.bind(this), this.chaptersFailed, {
                plainText: true
            });
        },

        chaptersLoaded: function (evt) {
            const data = srt(evt.responseText);
            if (_.isArray(data)) {
                _.each(data, this.addCue, this);
                this.drawCues();
            }
        },

        chaptersFailed: function () {},

        addCue: function (obj) {
            this.cues.push(new Cue(obj.begin, obj.text));
        },

        drawCues: function () {
            // We won't want to draw them until we have a duration
            const duration = this._model.mediaModel.get('duration');
            if (!duration || duration <= 0) {
                this._model.mediaModel.once('change:duration', this.drawCues, this);
                return;
            }

            const self = this;
            _.each(this.cues, function (cue) {
                cue.align(duration);
                cue.el.addEventListener('mouseover', function () {
                    self.activeCue = cue;
                });
                cue.el.addEventListener('mouseout', function () {
                    self.activeCue = null;
                });
                self.elementRail.appendChild(cue.el);
            });
        },

        resetChapters: function() {
            _.each(this.cues, function (cue) {
                if (cue.el.parentNode) {
                    cue.el.parentNode.removeChild(cue.el);
                }
            }, this);
            this.cues = [];
        }
    };
});
