define([
    'utils/helpers',
    'handlebars-loader!templates/error.html'
], function(utils, error) {

    function make(title, body) {
        return error({
            title: title,
            body: body
        });
    }

    return make;
});
