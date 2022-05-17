import UI from 'utils/ui';
import { transform, style } from 'utils/css';
import { addClass, removeClass } from 'utils/dom';

export default class FloatingDragUI {
    constructor(element) {
        this.container = element;
    }

    disable() {
        if (this.container) {
            // 'Dragged' state is reset so the transition animation can fire again if the player re-floats.
            removeClass(this.container, 'jw-floating-dragged');
            removeClass(this.container, 'jw-floating-dragging');
            setWillChange(this.container, 'auto');
        }

        this.uiMedia = this.uiMedia && this.uiMedia.destroy();
        this.uiBar = this.uiBar && this.uiBar.destroy();
        this.uiTitle = this.uiTitle && this.uiTitle.destroy();
        this.uiIcon = this.uiIcon && this.uiIcon.destroy();
    }

    enable() {
        this.inputMedia = this.container.querySelector('.jw-media');
        this.inputBar = this.container.querySelector('.jw-float-bar');
        this.inputTitle = this.container.querySelector('.jw-float-bar-title');
        this.inputIcon = this.container.querySelector('.jw-float-bar-icon');
        this.x = 0;
        this.y = 0;

        this.uiMedia = new UI(this.inputMedia, { preventScrolling: true })
            .on('dragStart', this.dragStart, this)
            .on('drag', this.drag, this)
            .on('dragEnd', this.dragEnd, this);
        this.uiBar = new UI(this.inputBar, { preventScrolling: true, directSelect: true })
            .on('dragStart', this.dragStart, this)
            .on('drag', this.drag, this)
            .on('dragEnd', this.dragEnd, this);
        this.uiTitle = new UI(this.inputTitle, { preventScrolling: true, directSelect: true })
            .on('dragStart', this.dragStart, this)
            .on('drag', this.drag, this)
            .on('dragEnd', this.dragEnd, this);
        this.uiIcon = new UI(this.inputIcon, { preventScrolling: true, directSelect: true })
            .on('dragStart', this.dragStart, this)
            .on('drag', this.drag, this)
            .on('dragEnd', this.dragEnd, this);
    }

    dragStart(e) {
        const { pageX, pageY } = e;
        const { innerWidth, innerHeight } = window;
        const { offsetLeft, offsetTop, offsetWidth, offsetHeight } = this.container;
        this.startX = pageX;
        this.startY = pageY;
        this.minDeltaX = -offsetLeft;
        this.minDeltaY = -offsetTop;
        this.maxDeltaX = calculateMax(innerWidth, offsetLeft, offsetWidth);
        this.maxDeltaY = calculateMax(innerHeight, offsetTop, offsetHeight);
        // Class prevents initial animation styles from overriding translate styling.
        addClass(this.container, 'jw-floating-dragged');
        addClass(this.container, 'jw-floating-dragging');
        setWillChange(this.container, 'transform');
    }

    drag(e) {
        const { pageX, pageY } = e;
        this.deltaX = calculateDelta(this.x, pageX, this.startX, this.maxDeltaX, this.minDeltaX);
        this.deltaY = calculateDelta(this.y, pageY, this.startY, this.maxDeltaY, this.minDeltaY);
        transform(this.container, `translate(${this.deltaX}px, ${this.deltaY}px)`);
    }

    dragEnd() {
        removeClass(this.container, 'jw-floating-dragging');
        setWillChange(this.container, 'auto');
        this.x = this.deltaX;
        this.y = this.deltaY;
    }
}

const calculateMax = (windowLength, offset, length) => windowLength - offset - length;
const calculateDelta = (last, current, first, max, min) => Math.max(Math.min(last + current - first, max), min);
const setWillChange = (element, willChange) => style(element, { willChange });
