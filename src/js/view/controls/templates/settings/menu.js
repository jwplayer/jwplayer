import { createElement } from 'utils/dom';

let parsedTemplate;

export default () => {
    if (!parsedTemplate) {
        parsedTemplate = createElement(
            `<div class="jw-reset jw-settings-menu" role="menu" aria-expanded="false">` +
                `<div class="jw-reset jw-settings-topbar" role="menubar">` +
                `</div>` +
            `</div>`
        );
    }
    return parsedTemplate.cloneNode(true);
};
