import ARROW_RIGHT_ICON from 'assets/SVG/arrow-right.svg';
import { HTMLTemplateString } from 'types/generic.type';

export interface MenuItem {
    name: string;
    label: string; 
    currentSelection: string;
    [key: string]: any;
}

export const itemTemplate = (content: string): HTMLTemplateString => `<button type="button" class="jw-reset-text jw-settings-content-item" aria-label="${content}" dir="auto">${content}</button>`;

export const itemMenuTemplate = ({ label, name, currentSelection }: MenuItem): HTMLTemplateString => {

    return (
        `<button type="button" class="jw-reset-text jw-settings-content-item" aria-label="${label}" aria-controls="jw-settings-submenu-${name}" dir="auto" aria-haspopup="true">` +
            `${label}` +
            `<div class='jw-reset jw-settings-value-wrapper'>` +
                `<div class="jw-reset-text jw-settings-content-item-value">${currentSelection}</div>` +
                `<div class="jw-reset-text jw-settings-content-item-arrow">${ARROW_RIGHT_ICON}</div>` +
            `</div>` +
       `</button>`
    );
};

export const itemRadioButtonTemplate = (content: string): HTMLTemplateString => {
    return (
        `<button type="button" class="jw-reset-text jw-settings-content-item" aria-label="${content}" role="menuitemradio" aria-checked="false" dir="auto">` +
            `${content}` +
        `</button>`
    );
};
