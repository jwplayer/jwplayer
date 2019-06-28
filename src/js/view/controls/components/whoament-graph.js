import { whoamentGraphContainer, whoamentGraphBar } from '../templates/whoament-graph';
import { createElement } from '../../../utils/dom';

export default class WhoamentGraph {
    constructor () {
        this.container = createElement(whoamentGraphContainer());
        this.bars = [];
    }

    render (map, duration) {
        this.destroy();
        const { bars, container } = this;
        for (let i = 0; i < duration; i++) {
            const bar = createElement(whoamentGraphBar());
            bar.style.height = `${2 * (map[i] || 1)}px`;
            container.appendChild(bar);
        }
    }

    element () {
        return this.container;
    }

    destroy () {
        this.container = createElement(whoamentGraphContainer());
    }
}