import type { HTMLTemplateString } from 'types/generic.type';

export default (): HTMLTemplateString => {
    return (
        `<div class="jw-seekbar-thumbnails">` +
            `<div class="jw-seekbar-thumb jw-reset"></div>` +
            `<div class="jw-seekbar-thumb jw-reset"></div>` +
            `<div class="jw-seekbar-thumb jw-active jw-reset"></div>` +
            `<div class="jw-seekbar-thumb jw-reset"></div>` +
            `<div class="jw-seekbar-thumb jw-reset"></div>` +
        `</div>`
    );
};
