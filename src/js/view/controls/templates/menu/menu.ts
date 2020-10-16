import type { HTMLTemplateString } from 'types/generic.type';

export const MenuTemplate = (isSubmenu: boolean, name: string): HTMLTemplateString => {
    return isSubmenu ? (
        `<div id="jw-settings-submenu-${name}" class="jw-reset jw-settings-submenu jw-settings-submenu-${name}" role="menu" aria-expanded="false">` +
            `<div class="jw-reset jw-settings-submenu-items"></div>` +
        `</div>`
    ) : (
        `<div id="jw-settings-menu" class="jw-reset jw-settings-menu" role="menu" aria-expanded="false">` +
            `<div class="jw-reset jw-settings-topbar" role="menubar">` +
                `<div class="jw-reset jw-settings-topbar-text" tabindex="0"></div>` +
                `<div class="jw-reset jw-settings-topbar-buttons"></div>` +
            `</div>` +
        `</div>`
    );
};

export const TizenMenuTemplate = (isSubmenu: boolean, name: string) => {
    return isSubmenu ? (
        `<div id="jw-settings-submenu-${name}" class="jw-reset jw-settings-submenu jw-settings-submenu-${name}" role="menu" aria-expanded="false">` +
            `<div class="jw-reset jw-settings-submenu-items"></div>` +
        `</div>`
    ) : (
        `<div id="jw-settings-menu-tizen" class="jw-reset jw-settings-menu-tizen" role="menu" aria-expanded="false"></div>`
    );
};

export const TizenSubmenuTemplate = (isSubmenu: boolean, name: string, title: string) => {
    return (
        `<div id="jw-settings-submenu-${name}" class="jw-reset jw-settings-submenu-tizen jw-settings-submenu-${name}">` +
            `<div class="jw-reset jw-reset-text jw-settings-topbar-text">${title}</div>` +
            `<div class="jw-reset jw-settings-submenu-items"></div>` +
        `</div>`
    );
};
