define([
    'utils/helpers',
    'handlebars-loader!templates/errorscreen.html'
], function(utils, errorscreen) {

    function make(title, body) {
        return errorscreen({
            title: title,
            body: body
        });
    }

    return make;
});
