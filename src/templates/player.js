import { createElement } from 'utils/dom';

let parsedTemplate;

export default (id, ariaLabel = '') => {
    if (!parsedTemplate) {
        parsedTemplate = createElement(
            `<div class="jwplayer jw-reset jw-state-setup" tabindex="0">` +
            `<div class="jw-aspect jw-reset"></div>` +
            `<div class="jw-media jw-reset"></div>` +
            `<div class="jw-preview jw-reset"></div>` +
            `<div class="jw-title jw-reset">` +
                `<div class="jw-title-primary jw-reset"></div>` +
                `<div class="jw-title-secondary jw-reset"></div>` +
            `</div>` +
            `<div class="jw-overlays jw-reset"></div>` +
            `</div>`
        );
    }
    const element = parsedTemplate.cloneNode(true);
    element.id = id;
    element.setAttribute('aria-label', ariaLabel);
    return element;
};
