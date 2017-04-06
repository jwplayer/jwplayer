import errorTemplate from 'templates/error';

define([
], function() {
    function make(id, skin, title, body) {
        return errorTemplate({
            id: id,
            skin: skin,
            title: title,
            body: body
        });
    }

    return make;
});
