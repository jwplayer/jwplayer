import { ajax } from 'utils/ajax';
import srt from 'parsers/captions/srt';

class Cue {
    constructor (time, text, cueType) {
        this.time = time;
        this.text = text;
        this.el = document.createElement('div');
        let cssClasses = 'jw-cue jw-reset';
        if (cueType && typeof cueType === 'string') {
            cssClasses += ` jw-cue-type-${cueType}`;
        }
        this.el.className = cssClasses;
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
            // Add chapter cues directly to model which will trigger addCue()
            const existingCues = this._model.get('cues');
            const newCues = existingCues.concat(data);
            this._model.set('cues', newCues);
        }
    },

    chaptersFailed: function () {},

    addCue: function (obj) {
        this.cues.push(new Cue(obj.begin, obj.text, obj.cueType));
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

    resetCues: function() {
        this.cues.forEach((cue) => {
            if (cue.el.parentNode) {
                cue.el.parentNode.removeChild(cue.el);
            }
        });
        this.cues = [];
    }
};

export default ChaptersMixin;
