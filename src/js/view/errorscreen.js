define([
    'utils/helpers',
    'underscore',
    'templates/errorscreen.html'
], function(utils,  _, errorscreen) {

    function make(container, title, body) {
        var html = errorscreen({
            title: title,
            body: body
        });

        container.appendChild(utils.createElement(html));
    }

    return make;
});
