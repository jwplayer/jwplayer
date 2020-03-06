import type { HTMLTemplateString } from 'types/generic.type';

type ShortcutDisplayOpts = {
    description: string;
    key: string;
}

export default (shortcuts: Array<ShortcutDisplayOpts>, title: string): HTMLTemplateString => {
    //  Iterate all shortcuts to create list of them.

    const list = shortcuts.map((shortcut: ShortcutDisplayOpts) => {
        return (
            `<div class="jw-shortcuts-row jw-reset">` +
                `<span class="jw-shortcuts-description jw-reset">${shortcut.description}</span>` +
                `<span class="jw-shortcuts-key jw-reset">${shortcut.key}</span>` +
            `</div>`
        );
    }).join('');

    return (
        `<div class="jw-shortcuts-tooltip jw-modal jw-reset" title="${title}">` +
            `<span class="jw-hidden" id="jw-shortcuts-tooltip-explanation">` +
                `Press shift question mark to access a list of keyboard shortcuts` +
            `</span>` +
            `<div class="jw-reset jw-shortcuts-container">` +
                `<div class="jw-reset jw-shortcuts-header">` +
                    `<span class="jw-reset jw-shortcuts-title">${title}</span>` +
                    `<button role="switch" class="jw-reset jw-switch" data-jw-switch-enabled="Enabled" data-jw-switch-disabled="Disabled">` +
                        `<span class="jw-reset jw-switch-knob"></span>` +
                    `</button>` +
                `</div>` +
                `<div class="jw-reset jw-shortcuts-tooltip-list">` +
                    `<div class="jw-shortcuts-tooltip-descriptions jw-reset">` +
                        `${list}` +
                    `</div>` +
                `</div>` +
            `</div>` +
        `</div>`
    );
};
