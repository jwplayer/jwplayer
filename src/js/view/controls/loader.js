let controls = null;

export function load() {
    if (controls) {
        return Promise.resolve(controls);
    }

    return new Promise(function (resolve, reject) {
        require.ensure(['view/controls/controls.js'], function (require) {
            controls = require('view/controls/controls.js').default;
            resolve(controls);
        }, 'jwplayer.controls');
    });
}
