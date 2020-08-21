import type { HTMLTemplateString } from 'types/generic.type';

export default (): HTMLTemplateString => {
    return (
        `<div class="jw-pause-display jw-reset">` +
            `<div class="jw-pause-display-container jw-reset">` +
                `<div class="jw-pause-title jw-reset-text"></div>` +
                `<div class="jw-pause-description jw-reset-text"></div>` +
            `</div>` +
        `</div>`
    );
};
