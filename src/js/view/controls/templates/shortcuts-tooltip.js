export default (shortcuts = {}) => {
    //  Iterate all shortcuts to create list of them. 
    const keyList = [];
    const descriptionList = [];
    
    shortcuts.forEach(shortcut => {
        keyList.push(`<div><span class="jw-hotkey">${shortcut.key}</span></div>`);
        descriptionList.push(`<div><span class="jw-hotkey-description">${shortcut.description}</span></div>`);
    });

    return (
        `<div class="jw-shortcuts-tooltip jw-modal jw-reset" title="Keyboard Shortcuts">` +
            `<span class="jw-hidden" id="jw-shortcuts-tooltip-explanation">` +
                `Press shift question mark to access a list of keyboard shortcuts` +
            `</span>` +
            `<div class="jw-reset jw-shortcuts-container">` +
                `<div class="jw-reset jw-shortcuts-title">Keyboard Shortcuts</div>` +
                `<div class="jw-reset jw-shortcuts-tooltip-list">` +
                    `<div class="jw-shortcuts-tooltip-descriptions jw-reset">` +
                        `${descriptionList.join('')}` +
                    `</div>` +
                    `<div class="jw-shortcuts-tooltip-keys jw-reset">` +
                        `${keyList.join('')}` +
                    `</div>` +
                `</div>` +
            `</div>` +
        `</div>`
    );
};
