import errorContainerTemplate from 'templates/error';
import { createElement } from 'utils/dom';
import { style } from 'utils/css';
import { OS } from 'environment/environment';
import TizenErrorContainer from 'view/controls/tizen/tizen-error';
import type Model from 'controller/model';
import type { PlayerError } from 'api/errors';
import type { PlayerAPI } from 'types/generic.type';

require('css/error.less');

export default function ErrorContainer(api: PlayerAPI, model: Model, error: PlayerError): HTMLElement {
    const { message, code } = error;
    const html = errorContainerTemplate(model.get('id'), message, model.get('localization').errors.errorCode, code.toString());
    const element = createElement(html);
    style(element, {
        background: 'black'
    });

    if (OS.tizen) {
        return TizenErrorContainer(api, element, model.get('localization'));
    }

    const width = model.get('width');
    const height = model.get('height');

    style(element, {
        width: width.toString().indexOf('%') > 0 ? width : `${width}px`,
        height: height.toString().indexOf('%') > 0 ? height : `${height}px`
    });

    return element;
}
