export const MenuTemplate = (isSubmenu, name) => {
    return isSubmenu ? (
        `<div id="jw-settings-submenu-${name}" class="jw-reset jw-settings-submenu jw-settings-submenu-${name}" role="menu" aria-expanded="false">` +
            `<div class="jw-settings-submenu-items"></div>` +
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
