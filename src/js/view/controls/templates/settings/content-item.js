export default (content) => {
    return (
        `<button type="button" class="jw-reset jw-settings-content-item" role="menuitemradio" aria-checked="false">` +
            `${content}` +
        `</button>`
    );
};
