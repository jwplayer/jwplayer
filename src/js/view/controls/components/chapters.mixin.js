import utils from 'utils/helpers';
import srt from 'parsers/captions/srt';

class Cue {
    constructor (time, text, playerWidth) {
        this.time = time;
        this.text = text;
        this.playerWidth = playerWidth;
        this.el = document.createElement('div');
        this.el.className = 'jw-cue jw-reset';
    }

    align(duration) {
        // If a percentage, use it, else calculate the percentage
        if (this.time.toString().slice(-1) === '%') {
            this.pct = this.time;
        } else {
            let markerWidth = 6;
            const percentage = (100 * this.time / duration) - (100 * markerWidth / this.playerWidth);
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
        const playerWidth = this._model.get('containerWidth');
        if (Array.isArray(data)) {
            data.forEach((obj) => this.addCue(obj, playerWidth));
            this.drawCues();
        }
    },

    chaptersFailed: function () {},

    addCue: function (obj, playerWidth) {
        this.cues.push(new Cue(obj.begin, obj.text, playerWidth));
    },

    drawCues: function () {
        // We won't want to draw them until we have a duration
        const duration = this._model.get('duration');
        if (!duration || duration <= 0) {
            this._model.player.once('change:duration', this.drawCues, this);
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
        this.cues.forEach((cue) => {
            if (cue.el.parentNode) {
                cue.el.parentNode.removeChild(cue.el);
            }
        });
        this.cues = [];
    }
};

export default ChaptersMixin;
