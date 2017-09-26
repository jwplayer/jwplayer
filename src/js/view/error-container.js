import errorContainerTemplate from 'templates/error';
import { createElement } from 'utils/dom';
import { style } from 'utils/css';

function ErrorContainer(model, message) {
    let element;

    const index = message.indexOf(':') + 1;
    const title = (index > 0) ? message.substr(0, index) : 'Error loading player:';
    const description = message.substr(index);
    const html = errorContainerTemplate(model.get('id'), title, description);
    const width = model.get('width');
    const height = model.get('height');

    element = createElement(html);

    style(element, {
        width: width.toString().indexOf('%') > 0 ? width : `${width}px`,
        height: height.toString().indexOf('%') > 0 ? height : `${height}px`
    });

    this.el = element;
}

Object.assign(ErrorContainer.prototype, {
    element() {
        return this.el;
    }
});

export default ErrorContainer;
