export default (menu) => {
    const { items = [] } = menu;
    const itemsHtml = items
        .map(item => {
            return rightClickItem(item.link, item.title, item.featured, item.showLogo);
        })
        .join('');

    return (
        `<div class="jw-rightclick">` +
            `<ul class="jw-rightclick-list">${itemsHtml}</ul>` +
        `</div>`
    );
};

const rightClickItem = (link = '', title = '', featured, showLogo) => {
    const logo = showLogo ? `<span class="jw-rightclick-logo"></span>` : '';
    return (
        `<li class=" jw-rightclick-item ${featured ? 'jw-featured' : ''}">` +
            `<a href="${link}" class="jw-rightclick-link" target="_blank">${logo}${title}</a>` +
        `</li>`
    );
};
