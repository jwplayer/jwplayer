define([

], function() {
    let controls = null;

    function load() {
        if (controls) {
            return Promise.resolve(controls);
        }

        return new Promise(function (resolve) {
            require.ensure(['view/controls/controls.js'], function (require) {
                controls = require('view/controls/controls.js');
                resolve(controls);
            }, 'jwplayer.controls');
        });
    }

    return {
        load: load
    };
});

