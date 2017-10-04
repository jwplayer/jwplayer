export default (content) => {
    return (
        `<button type="button" class="jw-settings-content-item" role="menuitemradio" aria-checked="false">` +
            `${content}` +
        `</button>`
    );
};
