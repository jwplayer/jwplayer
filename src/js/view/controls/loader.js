define([

], function() {
    let controls = null;

    function load() {
        if (controls) {
            return Promise.resolve(controls);
        }

        return new Promise(function (resolve) {
            require.ensure(['view/controls/controls'], function (require) {
                controls = require('view/controls/controls');
                resolve(controls);
            }, 'jwplayer.controls');
        });
    }

    return {
        load: load
    };
});

