export default (buttonClass = '', buttonId = '', image, ariaText) => {

    const style = image ? `style="background-image: url(${image})"` : '';
    const imageClass = image ? 'jw-button-image' : 'jw-button-image';

    const aria = ariaText ? `aria-label="${ariaText}" role="button" tabindex="0"` : '';

    return (
        `<div class="jw-icon jw-icon-inline jw-button-color jw-reset ${buttonClass}" button="${buttonId}">
            <div class="jw-icon ${imageClass} jw-button-color jw-reset" ${style} ${aria}></div>
        </div>`
    );
};
