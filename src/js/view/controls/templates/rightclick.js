export default (menu) => {
    const { items = [] } = menu;
    const itemsHtml = items
        .map(item => {
            return rightClickItem(item.link, item.title, item.featured, item.showLogo);
        })
        .join('');

    return (
      `<div class="jw-rightclick jw-reset">` +
        `<ul class="jw-reset">` +
            `${itemsHtml}` +
        `</ul>` +
      `</div>`
    );
};

const rightClickItem = (link = '', title = '', featured, showLogo) => {
    const logo = showLogo ? `<span class="jw-icon jw-rightclick-logo jw-reset"></span>` : '';
    return (
      `<li class="jw-reset ${featured ? 'jw-featured' : ''}">` +
        `<a href="${link}" class="jw-reset" target="_blank">` +
            `${logo}` +
            `${title}` +
        `</a>` +
      `</li>`
    );
};
