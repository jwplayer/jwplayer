define([
    'utils/helpers',
    'handlebars-loader!templates/errorscreen.html'
], function(utils, errorscreen) {

    function make(container, title, body) {
        var html = errorscreen({
            title: title,
            body: body
        });

        utils.removeClass(container, 'jw-setup-hide');
        container.appendChild(utils.createElement(html));
    }

    return make;
});
