define([
    'providers/html5',
    'providers/flash'
], function(html5, flash) {

    var Store = {
        html5: html5,
        flash: flash
    };

    return Store;
});
