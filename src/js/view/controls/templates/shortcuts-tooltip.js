export default (shortcuts, title) => {
    //  Iterate all shortcuts to create list of them. 

    const list = shortcuts.map((shortcut) => {
        return (
            `<div class="jw-shortcuts-row">` +
                `<span class="jw-shortcuts-description">${shortcut.description}</span>` +
                `<span class="jw-shortcuts-key">${shortcut.key}</span>` +
            `</div>`
        );
    }).join('');

    return (
        `<div class="jw-shortcuts-tooltip jw-modal jw-reset" title="${title}">` +
            `<span class="jw-hidden" id="jw-shortcuts-tooltip-explanation">` +
                `Press shift question mark to access a list of keyboard shortcuts` +
            `</span>` +
            `<div class="jw-reset jw-shortcuts-container">` +
                `<div class="jw-reset jw-shortcuts-title">${title}</div>` +
                `<div class="jw-reset jw-shortcuts-tooltip-list">` +
                    `<div class="jw-shortcuts-tooltip-descriptions jw-reset">` +
                        `${list}` +
                    `</div>` +
                `</div>` +
            `</div>` +
        `</div>`
    );
};
