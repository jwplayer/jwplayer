import { requestAnimationFrame, cancelAnimationFrame } from 'utils/request-animation-frame';
import { createElement } from 'utils/dom';
import { css, style } from 'utils/css';

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

let contractTriggerCssAdded = false;

const lazyAddCss = function() {
    if (!contractTriggerCssAdded) {
        contractTriggerCssAdded = true;
        css('.jw-contract-trigger::before', Object.assign({
            content: '',
            overflow: 'hidden',
            width: '200%',
            height: '200%'
        }, topLeft));
    }
};

export default class ResizeListener {

    constructor(element, callback) {
        lazyAddCss();

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

        style([expandElement, contractElement], Object.assign({ overflow: 'auto' }, topLeft, stretch));
        style(resizeElement, Object.assign({}, topLeft, stretch));

        this.expandElement = expandElement;
        this.expandChild = expandChild;
        this.contractElement = contractElement;
        this.hiddenElement = element.appendChild(resizeElement);
        this.element = element;
        this.callback = callback;
        this.resizeRaf = -1;
        this.lastWidth = this.currentWidth = 0;
        this.scrollListener = (e) => {
            cancelAnimationFrame(this.resizeRaf);
            this.resizeRaf = requestAnimationFrame(() => {
                const currentWidth = this.currentWidth = element.offsetWidth;
                if (this.lastWidth === currentWidth) {
                    return;
                }
                this.callback(e, currentWidth);
            });
            this.resetTriggers();
        };

        requestAnimationFrame(() => {
            this.currentWidth = element.offsetWidth;
            this.resetTriggers();
            element.addEventListener('scroll', this.scrollListener, true);
        });
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
