export default (id, message, errorCode, code) => {
    const detail = code ? (`(${errorCode}: ${code})`).replace(/\s+/g, '&nbsp;') : '';
    return (
        `<div id="${id}" class="jw-error jw-reset">` +
            `<div class="jw-error-msg jw-info-overlay jw-reset">` +
                `<style>` +
                `[id="${id}"].jw-error{background:#000;overflow:hidden;position:relative}` +
                `[id="${id}"] .jw-error-msg{top:50%;left:50%;position:absolute;transform:translate(-50%,-50%)}` +
                `[id="${id}"] .jw-error-text{text-align:start;color:#FFF;font:14px/1.35 Arial,Helvetica,sans-serif}` +
                `</style>` +
                `<div class="jw-icon jw-reset"></div>` +
                `<div class="jw-info-container jw-reset">` +
                    `<div class="jw-error-text jw-reset-text" dir="auto">${(message || '')}<span class="jw-break jw-reset"></span>${detail}</div>` +
                `</div>` +
            `</div>` +
        `</div>`
    );
};
