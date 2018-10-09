export default (ariaLabel) => {
    return (
        `<div class="jw-float-close jw-reset" aria-label=${ariaLabel} tabindex="0">` +
        `</div>`
    );
};
