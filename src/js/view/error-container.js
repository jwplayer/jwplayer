import errorContainerTemplate from 'templates/error';
import { createElement } from 'utils/dom';
import { style } from 'utils/css';

export default function ErrorContainer(model, message) {
    const index = message.indexOf(':') + 1;
    const title = (index > 0) ? message.substr(0, index) : 'Error loading player:';
    const description = message.substr(index);
    const html = errorContainerTemplate(model.get('id'), title, description);
    const width = model.get('width');
    const height = model.get('height');
    const element = createElement(html);

    style(element, {
        width: width.toString().indexOf('%') > 0 ? width : `${width}px`,
        height: height.toString().indexOf('%') > 0 ? height : `${height}px`
    });

    return element;
}
