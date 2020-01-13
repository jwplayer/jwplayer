import ARROW_RIGHT_ICON from 'assets/SVG/arrow-right.svg';
export const itemTemplate = (content) => `<button type="button" class="jw-reset-text jw-settings-content-item" dir="auto">${content}</button>`;

export const itemMenuTemplate = (content) => {
    return (
        `<button type="button" class="jw-reset-text jw-settings-content-item" aria-label="${content.label}" aria-controls="jw-settings-submenu-${content.value}" dir="auto" aria-haspopup="true">` +
            `${content.label}` +
            `<div class='jw-reset jw-settings-value-wrapper'>` +
                `<div class="jw-reset-text jw-settings-content-item-value">${content.value}</div>` +
                `<div class="jw-reset-text jw-settings-content-item-arrow">${ARROW_RIGHT_ICON}</div>` +
            `</div>` +
       `</button>`
    );
};

export const itemRadioButtonTemplate = (content) => {
    return (
        `<button type="button" class="jw-reset-text jw-settings-content-item" aria-label="${content.label}" role="menuitemradio" aria-checked="false" dir="auto">` +
            `${content}` +
        `</button>`
    );
};
