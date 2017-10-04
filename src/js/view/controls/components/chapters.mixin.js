import _ from 'utils/underscore';
import utils from 'utils/helpers';
import srt from 'parsers/captions/srt';

class Cue {
    constructor (time, text) {
        this.time = time;
        this.text = text;
        this.el = document.createElement('div');
        this.el.className = 'jw-cue';
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

const ChaptersMixin = {

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
        const duration = this._model.get('duration');
        if (!duration || duration <= 0) {
            this._model.once('change:duration', this.drawCues, this);
            return;
        }

        _.each(this.cues, (cue) => {
            cue.align(duration);
            cue.el.addEventListener('mouseover', () => {
                this.activeCue = cue;
            });
            cue.el.addEventListener('mouseout', () => {
                this.activeCue = null;
            });
            this.elementRail.appendChild(cue.el);
        });
    },

    resetChapters: function() {
        _.each(this.cues, (cue) => {
            if (cue.el.parentNode) {
                cue.el.parentNode.removeChild(cue.el);
            }
        });
        this.cues = [];
    }
};

export default ChaptersMixin;
