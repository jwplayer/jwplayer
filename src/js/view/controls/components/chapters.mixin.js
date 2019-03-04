import { ajax } from 'utils/ajax';
import srt from 'parsers/captions/srt';

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

const ChaptersMixin = {

    loadChapters: function (file) {
        ajax(file, this.chaptersLoaded.bind(this), this.chaptersFailed, {
            plainText: true
        });
    },

    chaptersLoaded: function (evt) {
        const data = srt(evt.responseText);
        if (Array.isArray(data)) {
            data.forEach((obj) => this.addCue(obj));
            this.drawCues();
        }
    },

    chaptersFailed: function () {},

    addCue: function (obj) {
        this.cues.forEach((cue) => {
            if (cue.time === obj.begin) {
                this.removeCue(cue);
            }
        });
        this.cues.push(new Cue(obj.begin, obj.text));
    },

    removeCue: function (cueToRemove) {
        const cueIndex = this.cues.findIndex(cue => cue.time === cueToRemove.time);
        if (cueToRemove.el.parentNode) {
            cueToRemove.el.parentNode.removeChild(cueToRemove.el);
        }
        this.cues.splice(cueIndex, 1);
    },

    drawCues: function () {
        // We won't want to draw them until we have a duration
        const duration = this._model.get('duration');
        if (!duration || duration <= 0) {
            return;
        }

        this.cues.forEach((cue) => {
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
        this.cues.forEach((cue) => this.removeCue(cue));
        this.cues = [];
    }
};

export default ChaptersMixin;
