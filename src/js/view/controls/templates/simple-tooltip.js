export default (name, text) => {
    return (
        `<div class="jw-reset jw-tooltip jw-tooltip-${name}">` +
            `<div class="jw-text">${text}</div>` +
        `</div>`
    );
};

