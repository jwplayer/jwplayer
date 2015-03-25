define([
    'utils/helpers',
    'templates/errorscreen.html'
], function(utils, errorscreen) {

    function make(container, title, body) {
        var html = errorscreen({
            title: title,
            body: body
        });

        container.appendChild(utils.createElement(html));
    }

    return make;
});
