import { createElement } from 'utils/dom';

let parsedTemplate;

export default () => {
    if (!parsedTemplate) {
        parsedTemplate = createElement(
            `<div class="jw-reset jw-settings-submenu" role="menu" aria-expanded="false">` +
            `</div>`
        );
    }
    return parsedTemplate.cloneNode(true);
};
