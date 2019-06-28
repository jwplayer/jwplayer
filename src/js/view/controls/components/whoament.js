import { SimpleTooltip } from 'view/controls/components/simple-tooltip';

const WIDTH = 5;
export default class Whoament {
    constructor (element) {
        this.element = element;
        this.tip = null;
    }

    create (peakPosition, duration, attentionMap) {
        const { element } = this;
        const whoamentSlice = attentionMap.slice(Math.max(0,  peakPosition - WIDTH), peakPosition + WIDTH);
        const width = (whoamentSlice.length / duration) * 100;
        const left = ((peakPosition - WIDTH) /  duration) * 100;
        element.style.width = `${width}%`;
        element.style.left = `${left}%`;
        element.style.visibility = 'visible';
    }

    destroy () {
        this.element.style.visibility = 'hidden';
    }
}