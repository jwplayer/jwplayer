import errorContainerTemplate from 'templates/error';
import { createElement } from 'utils/dom';
import { style } from 'utils/css';

export default class ErrorContainer {
    constructor(model) {
        if (model) {
            this.el = createElement(errorContainerTemplate(model.get('id')));
            this.setDimensions(model.get('width'), model.get('height'));
        } else {
            this.el = createElement(errorContainerTemplate()).firstChild;
        }
        this.title = this.el.querySelector('.jw-title-primary');
        this.message = this.el.querySelector('.jw-title-secondary');
    }

    setDimensions(width, height) {
        style(this.el, {
            width: width.toString().indexOf('%') > 0 ? width : `${width}px`,
            height: height.toString().indexOf('%') > 0 ? height : `${height}px`
        });
    }

    setContainer(container) {
        if (this.el) {
            container.appendChild(this.el);
        }
    }

    setMessage(msg) {
        const index = msg.indexOf(':') + 1;
        this.title.innerHTML = 'Error loading player:';
        if (index > 0) {
            this.title.innerHTML = msg.substr(0, index);
        }
        this.message.innerHTML = msg.substr(index);
    }

    element() {
        return this.el;
    }
}
