import UI from 'utils/ui';
import { style } from 'utils/css';
import { addClass, removeClass } from 'utils/dom';

export default class FloatingDragUI {
    constructor(element) {
        this.container = element;
        this.input = element.querySelector('.jw-media');
    }

    disable() {
        if (this.ui) {
            // 'Dragged' state is reset so the transition animation can fire again if the player re-floats.
            removeClass(this.container, 'jw-floating-dragged');
            removeClass(this.container, 'jw-floating-dragging');
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
                const { outerWidth, outerHeight } = window;
                const { offsetLeft, offsetTop, offsetWidth, offsetHeight } = container;
                startX = pageX;
                startY = pageY;
                minDeltaX = -offsetLeft;
                minDeltaY = -offsetTop;
                maxDeltaX = calculateMax(outerWidth, offsetLeft, offsetWidth);
                maxDeltaY = calculateMax(outerHeight, offsetTop, offsetHeight);
                // Class prevents initial animation styles from overriding translate styling.
                addClass(container, 'jw-floating-dragged');
                addClass(container, 'jw-floating-dragging');
            })
            .on('drag', (e) => {
                const { pageX, pageY } = e;
                deltaX = calculateDelta(x, pageX, startX, maxDeltaX, minDeltaX);
                deltaY = calculateDelta(y, pageY, startY, maxDeltaY, minDeltaY);
                style(container, {
                    transform: `translate3d(${deltaX}px, ${deltaY}px, 0)`,
                });
            })
            .on('dragEnd', () => {
                removeClass(container, 'jw-floating-dragging');
                x = deltaX;
                y = deltaY;
            });
    }
}

const calculateMax = (windowLength, offset, length) => windowLength - offset - length;
const calculateDelta = (last, current, first, max, min) => Math.max(Math.min(last + current - first, max), min);
