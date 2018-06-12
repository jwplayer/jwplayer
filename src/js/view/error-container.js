import errorContainerTemplate from 'templates/error';
import { createElement } from 'utils/dom';
import { style } from 'utils/css';

export default function ErrorContainer(model, error) {
    const { message, code } = error;
    const html = errorContainerTemplate(model.get('id'), message, model.get('localization').errors.errorCode, code);
    const width = model.get('width');
    const height = model.get('height');
    const element = createElement(html);

    style(element, {
        width: width.toString().indexOf('%') > 0 ? width : `${width}px`,
        height: height.toString().indexOf('%') > 0 ? height : `${height}px`
    });

    return element;
}
