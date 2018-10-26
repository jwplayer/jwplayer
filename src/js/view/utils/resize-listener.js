import { requestAnimationFrame, cancelAnimationFrame } from 'os/utils/request-animation-frame';
import { createElement } from 'os/utils/dom';

export default class ResizeListener {

    constructor(element, callback) {
        const hiddenHtml = '<div class="jw-resize-trigger"><div class="jw-expand-trigger">' +
            '<div style="height:1px;"></div></div><div class="jw-contract-trigger"></div></div>';
        const hiddenElement = createElement(hiddenHtml);
        const expandElement = hiddenElement.firstChild;
        const expandChild = expandElement.firstChild;
        const contractElement = expandElement.nextSibling;

        if (getComputedStyle(element).position === 'static') {
            element.style.position = 'relative';
        }

        this.expandElement = expandElement;
        this.expandChild = expandChild;
        this.contractElement = contractElement;
        this.hiddenElement = element.appendChild(hiddenElement);
        this.element = element;
        this.callback = callback;
        this.resizeRaf = -1;
        this.lastWidth = 0;
        this.currentWidth = element.offsetWidth;

        this.scrollListener = (e) => {
            let resizeRaf = this.resizeRaf;
            if (resizeRaf) {
                cancelAnimationFrame(resizeRaf);
            }
            resizeRaf = requestAnimationFrame(() => {
                const currentWidth = this.currentWidth = element.offsetWidth;
                if (this.lastWidth === currentWidth) {
                    return;
                }
                this.callback(e, currentWidth);
            });
            this.resizeRaf = resizeRaf;
            this.resetTriggers();
        };

        element.addEventListener('scroll', this.scrollListener, true);
        this.resetTriggers();
    }

    resetTriggers() {
        const currentWidth = this.currentWidth;
        this.contractElement.scrollLeft = currentWidth * 2;
        this.expandChild.style.width = currentWidth + 1 + 'px';
        this.expandElement.scrollLeft = currentWidth + 1;
        this.lastWidth = currentWidth;
    }

    destroy() {
        if (this.callback) {
            this.element.removeEventListener('scroll', this.scrollListener, true);
            this.element.removeChild(this.hiddenElement);
            this.scrollListener =
                this.callback = null;
        }
    }
}
