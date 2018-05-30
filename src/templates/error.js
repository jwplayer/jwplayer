export default (id, message, code) => {
    const detail = code ? `(Error code: ${code})` : '';
    return (
        `<div id="${id}" class="jw-error jw-reset">` +
            `<div class="jw-error-msg jw-reset">` +
                `<style>` +
                `[id="${id}"].jw-error{position:relative;background:#000;overflow:hidden;position:relative}` +
                `[id="${id}"] .jw-error-msg{top:50%;left:50%;position:absolute;align-items:center;display:flex;transform:translate(-50%,-50%)}` +
                `[id="${id}"] .jw-title{color:#FFF;position:static}` +
                `[id="${id}"] .jw-title-primary,` +
                `[id="${id}"] .jw-title-secondary{font:600 14px/1.35 Arial,Helvetica,sans-serif}` +
                `[id="${id}"] .jw-title-secondary{font-weight:400}` +
                `</style>` +
                `<div class="jw-icon jw-reset"></div>` +
                `<div class="jw-title jw-reset">` +
                    `<div class="jw-title-primary jw-reset">${message || ''}</div>` +
                    `<div class="jw-title-secondary jw-reset">${detail}</div>` +
                `</div>` +
            `</div>` +
        `</div>`
    );
};
