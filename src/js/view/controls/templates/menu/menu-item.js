import ARROW_RIGHT_ICON from 'assets/SVG/arrow-right.svg';
export const itemTemplate = (content) => `<button type="button" class="jw-reset-text jw-settings-content-item" aria-label="${content}" dir="auto">${content}</button>`;

export const itemMenuTemplate = ({ name, label, currentSelection }) => {
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

export const itemRadioButtonTemplate = (content) => {
    return (
        `<button type="button" class="jw-reset-text jw-settings-content-item" aria-label="${content}" role="menuitemradio" aria-checked="false" dir="auto">` +
            `${content}` +
        `</button>`
    );
};
