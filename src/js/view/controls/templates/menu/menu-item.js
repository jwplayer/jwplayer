export const itemTemplate = (content) => `<button type="button" class="jw-reset-text jw-settings-content-item" dir="auto">${content}</button>`;

export const itemRadioButtonTemplate = (content) => {
    return (
        `<button type="button" class="jw-reset-text jw-settings-content-item" role="menuitemradio" aria-checked="false" dir="auto">` +
            `${content}` +
        `</button>`
    );
};
