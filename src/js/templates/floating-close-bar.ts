import type { HTMLTemplateString } from 'types/generic.type';

export default (ariaLabel: string, title: string): HTMLTemplateString => {
    return (
        `<div class="jw-float-bar jw-reset">
            <div class="jw-float-bar-title" aria-label="${title}" >${title}</div>
            <div class="jw-float-bar-icon jw-icon jw-button-color jw-reset" aria-label="${ariaLabel}" tabindex="0">
            </div>
        </div>`
    );
};
