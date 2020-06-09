import { ajax } from 'utils/ajax';
import srt from 'parsers/captions/srt';
import type { TimeSliderWithMixins } from './timeslider';
import type { GenericObject } from 'types/generic.type';

export class Cue {
    time: number | string;
    text: string;
    el: HTMLElement;
    pct?: number | string;

    constructor (time: number, text: string, cueType: string) {
        this.time = time;
        this.text = text;
        this.el = document.createElement('div');
        let cssClasses = 'jw-cue jw-reset';
        if (cueType && typeof cueType === 'string') {
            cssClasses += ` jw-cue-type-${cueType}`;
        }
        this.el.className = cssClasses;
    }

    align(duration: number): void {
        // If a percentage, use it, else calculate the percentage
        if (this.time.toString().slice(-1) === '%') {
            this.pct = this.time as string;
        } else {
            const percentage = ((this.time as number) / duration) * 100;
            this.pct = percentage + '%';
        }

        this.el.style.left = this.pct;
    }
}

export interface ChaptersMixinInt {
    loadChapters: (file: string) => void;
    chaptersLoaded: (this: TimeSliderWithMixins, evt: XMLHttpRequest) => void;
    chaptersFailed: () => void;
    addCue: (this: TimeSliderWithMixins, obj: GenericObject) => void;
    drawCues: (this: TimeSliderWithMixins) => void;
    resetCues: (this: TimeSliderWithMixins) => void;
}

const ChaptersMixin: ChaptersMixinInt = {

    loadChapters: function (file: string): void {
        ajax(file, this.chaptersLoaded.bind(this), this.chaptersFailed, {
            plainText: true
        });
    },

    chaptersLoaded: function (this: TimeSliderWithMixins, evt: XMLHttpRequest): void {
        const data = srt(evt.responseText);
        if (Array.isArray(data)) {
            // Add chapter cues directly to model which will trigger addCue()
            const existingCues = this._model.get('cues');
            const newCues = existingCues.concat(data);
            this._model.set('cues', newCues);
        }
    },

    chaptersFailed: function (): void { /* */ },

    addCue: function (this: TimeSliderWithMixins, obj: GenericObject): void {
        this.cues.push(new Cue(obj.begin, obj.text, obj.cueType));
    },

    drawCues: function (this: TimeSliderWithMixins): void {
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

    resetCues: function(this: TimeSliderWithMixins): void {
        this.cues.forEach((cue: Cue) => {
            if (cue.el.parentNode) {
                cue.el.parentNode.removeChild(cue.el);
            }
        });
        this.cues = [];
    }
};

export default ChaptersMixin;
