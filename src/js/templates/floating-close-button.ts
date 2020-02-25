import { HTMLTemplateString } from 'types/generic.type';

export default (ariaLabel: string): HTMLTemplateString => {
    return (
        `<div class="jw-float-icon jw-icon jw-button-color jw-reset" aria-label=${ariaLabel} tabindex="0">` +
        `</div>`
    );
};
