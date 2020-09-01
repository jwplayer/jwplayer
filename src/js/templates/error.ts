import type { HTMLTemplateString } from 'types/generic.type';

export default (id: string, message: string | undefined, errorCode: string, code: string): HTMLTemplateString => {
    const detail: string = code ? (`(${errorCode}: ${code})`).replace(/\s+/g, '&nbsp;') : '';
    return (
        `<div id="${id}" class="jw-error jw-reset">` +
            `<div class="jw-error-msg jw-info-overlay jw-reset">` +
                `<div class="jw-icon jw-reset"></div>` +
                `<div class="jw-info-container jw-reset">` +
                    `<div class="jw-error-text jw-reset-text" dir="auto">${(message || '')}<span class="jw-break jw-reset"></span>${detail}</div>` +
                `</div>` +
            `</div>` +
        `</div>`
    );
};
