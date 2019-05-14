import { requestAnimationFrame, cancelAnimationFrame } from 'utils/request-animation-frame';
import { createElement } from 'utils/dom';
import { style } from 'utils/css';

const instances = [];
let resizeRaf = -1;

function scrollListener() {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => {
        instances.forEach(resizeListener => {
            resizeListener.view.updateBounds();
            const width = resizeListener.view.model.get('containerWidth');
            resizeListener.resized = resizeListener.width !== width;
            resizeListener.width = width;
        });
        instances.forEach(resizeListener => {
            resizeListener.contractElement.scrollLeft = resizeListener.width * 2;
        });
        instances.forEach(resizeListener => {
            style(resizeListener.expandChild, { width: resizeListener.width + 1 });
            if (resizeListener.resized && resizeListener.view.model.get('visibility')) {
                resizeListener.view.updateStyles();
            }
        });
        instances.forEach(resizeListener => {
            resizeListener.expandElement.scrollLeft = resizeListener.width + 1;
        });
        instances.forEach(resizeListener => {
            if (resizeListener.resized) {
                resizeListener.view.checkResized();
            }
        });
    });
}

export default class ResizeListener {

    constructor(element, view, model) {
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
        this.view = view;
        this.model = model;
        this.width = 0;
        this.resized = false;
        if (element.firstChild) {
            element.insertBefore(resizeElement, element.firstChild);
        } else {
            element.appendChild(resizeElement);
        }
        element.addEventListener('scroll', scrollListener, true);
        instances.push(this);
        scrollListener();
    }

    destroy() {
        if (this.view) {
            const index = instances.indexOf(this);
            if (index !== -1) {
                instances.splice(index, 1);
            }
            this.element.removeEventListener('scroll', scrollListener, true);
            this.element.removeChild(this.hiddenElement);
            this.view =
                this.model = null;
        }
    }
}
