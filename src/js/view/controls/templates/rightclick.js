export default (menu, localization) => {
    const { items = [] } = menu;
    const menuItems = items
        .map(item => {
            return rightClickItem(item.link, item.title, item.featured, item.showLogo);
        });
    menuItems.unshift(infoOverlayItem(localization.videoInfo));

    return (
        `<div class="jw-rightclick jw-reset">` +
            `<ul class="jw-rightclick-list jw-reset">${menuItems.join('')}</ul>` +
        `</div>`
    );
};

const rightClickItem = (link = '', title = '', featured, showLogo) => {
    const logo = showLogo ? `<span class="jw-rightclick-logo jw-reset"></span>` : '';
    return (
        `<li class="jw-reset jw-rightclick-item ${featured ? 'jw-featured' : ''}">` +
            `<a href="${link}" class="jw-rightclick-link jw-reset" target="_blank">${logo}${title}</a>` +
        `</li>`
    );
};

const infoOverlayItem = (videoInfoLocalization) => {
    return (
        `<li class="jw-reset jw-rightclick-item">` +
            `<button type="button" class="jw-reset jw-rightclick-link jw-info-overlay-item">${videoInfoLocalization}</button>` +
        `</li>`
    );
};


