export default (className = '', orientation = '') => {
    return (
        `<div class="${className} ${orientation}" aria-hidden="true">` +
            `<div class="jw-slider-container">` +
                `<div class="jw-rail"></div>` +
                `<div class="jw-buffer"></div>` +
                `<div class="jw-progress"></div>` +
                `<div class="jw-knob"></div>` +
            `</div>` +
        `</div>`
    );
};
