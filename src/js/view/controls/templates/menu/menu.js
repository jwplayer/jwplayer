export const MenuTemplate = (isSubmenu, name) => {
    return isSubmenu ? (
        `<div class="jw-reset jw-settings-submenu jw-settings-submenu-${name}" role="menu" aria-expanded="false">` +
        `</div>`
    ) : (
        `<div class="jw-reset jw-settings-menu" role="menu" aria-expanded="false">` +
            `<div class="jw-reset jw-settings-topbar" role="menubar">` +
            `</div>` +
        `</div>`
    );
};
