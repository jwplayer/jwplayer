import { requestAnimationFrame, cancelAnimationFrame } from 'os/utils/request-animation-frame';
import { createElement } from 'os/utils/dom';
import { css, style } from 'os/utils/css';

export default class ResizeListener {

    constructor(element, callback) {
        const topLeft = {
            display: 'block',
            position: 'absolute',
            top: 0,
            left: 0
        };

        const stretch = {
            width: '100%',
            height: '100%'
        };

        css('.jw-contract-trigger::before', Object.assign({
            content: '',
            overflow: 'hidden',
            width: '200%',
            height: '200%'
        }, topLeft));

        const hiddenHtml = '<div style="opacity:0;visibility:hidden;overflow:hidden;">' + // resizeElement
            '<div>' + // expandElement
            '<div style="height:1px;">' + // expandChild
            '</div></div>' +
            '<div class="jw-contract-trigger">' + // contractElement
            '</div></div>';
        const resizeElement = createElement(hiddenHtml);
        const expandElement = resizeElement.firstChild;
        const expandChild = expandElement.firstChild;
        const contractElement = expandElement.nextSibling;

        if (getComputedStyle(element).position === 'static') {
            style(element, { position: 'relative' });
        }

        style([expandElement, contractElement], Object.assign({ overflow: 'auto' }, topLeft, stretch));
        style(resizeElement, Object.assign({}, topLeft, stretch));

        this.expandElement = expandElement;
        this.expandChild = expandChild;
        this.contractElement = contractElement;
        this.hiddenElement = element.appendChild(resizeElement);
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
        style(this.expandChild, { width: currentWidth + 1 });
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
