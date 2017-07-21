export default (items = []) => {
    const itemsHtml = items
        .map((item, index) => {
            return menuItem(index, item.label);
        })
        .join('');

    return (
      `<ul class="jw-menu jw-background-color jw-reset">` +
          `${itemsHtml}` +
      `</ul>`
    );
};

const menuItem = (index = '', label = '') => {
    return (
        `<li class='jw-text jw-option jw-item-${index} jw-reset'>${label}</li>`
    );
};
