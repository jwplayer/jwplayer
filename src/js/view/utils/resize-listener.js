import { requestAnimationFrame, cancelAnimationFrame } from 'utils/request-animation-frame';
import { createElement } from 'utils/dom';
import { style } from 'utils/css';

const instances = [];
let resizeRaf = -1;

function scrollListener() {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => {
        instances.forEach(resizeListener => {
            resizeListener.updateBounds();
        });
        instances.forEach(resizeListener => {
            resizeListener.contractElement.scrollLeft = resizeListener.width * 2;
        });
        instances.forEach(resizeListener => {
            style(resizeListener.expandChild, { width: resizeListener.width + 1 });
        });
        instances.forEach(resizeListener => {
            resizeListener.expandElement.scrollLeft = resizeListener.width + 1;
        });
        instances.forEach(resizeListener => {
            resizeListener.checkResize();
        });
    });
}

export default class ResizeListener {

    constructor(element, callback, initialWidth) {
        if (!initialWidth) {
            initialWidth = element.offsetWidth;
        }
        const hiddenHtml = '<div style="opacity:0;visibility:hidden;overflow:hidden;">' + // resizeElement
            '<div>' + // expandElement
            '<div style="height:1px;">' + // expandChild
            '</div></div>' +
            '<div class="jw-contract-trigger">' + // contractElement
            '</div></div>';

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

        const resizeElement = createElement(hiddenHtml);
        const expandElement = resizeElement.firstChild;
        const expandChild = expandElement.firstChild;
        const contractElement = expandElement.nextSibling;

        style([expandElement, contractElement], Object.assign({ overflow: 'auto' }, topLeft, stretch));
        style(resizeElement, Object.assign({}, topLeft, stretch));

        this.expandElement = expandElement;
        this.expandChild = expandChild;
        this.contractElement = contractElement;
        this.hiddenElement = resizeElement;
        this.element = element;
        this.callback = callback;
        this.width = initialWidth;
        this.lastWidth = initialWidth;
        if (element.firstChild) {
            element.insertBefore(resizeElement, element.firstChild);
        } else {
            element.appendChild(resizeElement);
        }
        element.addEventListener('scroll', scrollListener, true);
        instances.push(this);
        scrollListener();
    }

    updateBounds() {
        this.width = this.element.offsetWidth;
    }

    checkResize() {
        const currentWidth = this.width;
        if (this.lastWidth !== currentWidth && this.callback) {
            this.callback(currentWidth);
            this.lastWidth = currentWidth;
        }
    }

    destroy() {
        if (this.callback) {
            const index = instances.indexOf(this);
            if (index !== -1) {
                instances.splice(index, 1);
            }
            this.element.removeEventListener('scroll', this.scrollListener, true);
            this.element.removeChild(this.hiddenElement);
            this.scrollListener =
                this.callback = null;
        }
    }
}
