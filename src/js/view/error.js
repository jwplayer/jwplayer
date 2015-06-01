define([
    'utils/helpers',
    'handlebars-loader!templates/error.html'
], function(utils, error) {

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
