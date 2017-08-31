export default (buttonClass = '', buttonId = '', image = '', ariaText) => {

    let imageDiv = '';
    if (image.substring(0, 4) === '<svg') {
        imageDiv = image;
    } else {
        const style = image ? `style="background-image: url(${image})"` : '';
        const imageClass = image ? 'jw-button-image' : 'jw-button-image';
        const aria = ariaText ? `aria-label="${ariaText}"` : '';
        imageDiv = `<div class="jw-icon ${imageClass} jw-button-color jw-reset" ${style} ${aria}></div>`;
    }
    return (
        `<div class="jw-icon jw-icon-inline jw-button-color jw-reset ${buttonClass}" button="${buttonId}" role="button" tabindex="0">
            ${imageDiv}
        </div>`
    );
};
