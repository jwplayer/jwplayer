import type { HTMLTemplateString } from 'types/generic.type';

export default (): HTMLTemplateString => (
    `<div class="jw-reset jw-info-overlay jw-modal">` +
        `<div class="jw-reset jw-info-container">` +
            `<div class="jw-reset-text jw-info-title" dir="auto"></div>` +
            `<div class="jw-reset-text jw-info-duration" dir="auto"></div>` +
            `<div class="jw-reset-text jw-info-description" dir="auto"></div>` +
        `</div>` +
        `<div class="jw-reset jw-info-clientid"></div>` +
    `</div>`
);
