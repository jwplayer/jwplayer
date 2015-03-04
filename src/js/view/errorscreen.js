define([
    'utils/helpers',
    'underscore',
    'raw!templates/errorscreen.html'
], function(utils, _, errorscreen) {

    var template = _.template(errorscreen);

    function make(container, title, body) {
        var html = template({
            title: title,
            body: body
        });

        container.appendChild(utils.createElement(html));
    }

    return make;
});
