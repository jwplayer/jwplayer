define([
    'templates/error.html'
], function(error) {

    function make(id, skin, title, body) {
        return error({
            id: id,
            skin: skin,
            title: title,
            body: body
        });
    }

    return make;
});
