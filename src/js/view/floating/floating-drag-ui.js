import UI from 'utils/ui';
import { transform, style } from 'utils/css';
import { addClass, removeClass } from 'utils/dom';

export default class FloatingDragUI {
    constructor(element) {
        this.container = element;
        this.input = element.querySelector('.jw-media');
    }

    disable() {
        const container = this.container;
        if (container) {
            // 'Dragged' state is reset so the transition animation can fire again if the player re-floats.
            removeClass(container, 'jw-floating-dragged');
            removeClass(container, 'jw-floating-dragging');
            setWillChange(container, 'auto');
        }
        if (this.ui) {
            this.ui.destroy();
            this.ui = null;
        }
    }

    enable() {
        const { container, input } = this;
        let startX;
        let startY;
        let deltaX;
        let deltaY;
        let x = 0;
        let y = 0;
        // A min/max delta is assigned to prevent the player from being dragged off screen.
        let minDeltaX;
        let minDeltaY;
        let maxDeltaX;
        let maxDeltaY;
        this.ui = new UI(input, { preventScrolling: true })
            .on('dragStart', (e) => {
                const { pageX, pageY } = e;
                const { innerWidth, innerHeight } = window;
                const { offsetLeft, offsetTop, offsetWidth, offsetHeight } = container;
                startX = pageX;
                startY = pageY;
                minDeltaX = -offsetLeft;
                minDeltaY = -offsetTop;
                maxDeltaX = calculateMax(innerWidth, offsetLeft, offsetWidth);
                maxDeltaY = calculateMax(innerHeight, offsetTop, offsetHeight);
                // Class prevents initial animation styles from overriding translate styling.
                addClass(container, 'jw-floating-dragged');
                addClass(container, 'jw-floating-dragging');
                setWillChange(container, 'transform');
            })
            .on('drag', (e) => {
                const { pageX, pageY } = e;
                deltaX = calculateDelta(x, pageX, startX, maxDeltaX, minDeltaX);
                deltaY = calculateDelta(y, pageY, startY, maxDeltaY, minDeltaY);
                transform(container, `translate(${deltaX}px, ${deltaY}px)`);
            })
            .on('dragEnd', () => {
                removeClass(container, 'jw-floating-dragging');
                setWillChange(container, 'auto');
                x = deltaX;
                y = deltaY;
            });
    }
}

const calculateMax = (windowLength, offset, length) => windowLength - offset - length;
const calculateDelta = (last, current, first, max, min) => Math.max(Math.min(last + current - first, max), min);
const setWillChange = (element, willChange) => style(element, { willChange });
