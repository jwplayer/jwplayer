import errorTemplate from 'templates/error';

define([
], function() {
    function make(id, title, body) {
        return errorTemplate(id, title, body);
    }

    return make;
});
