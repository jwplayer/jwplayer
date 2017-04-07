import errorTemplate from 'templates/error';

define([
], function() {
    function make(id, skin, title, body) {
        return errorTemplate(id, skin, title, body);
    }

    return make;
});
