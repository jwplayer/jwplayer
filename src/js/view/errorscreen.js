define([
    'underscore',
    'raw!templates/errorscreen.html'
], function(_, errorscreen) {

    var template = _.template(errorscreen);

    function make(container, title, body) {
        var html = template({
            title: title,
            body: body
        });

        container.appendChild(html);
    }

    return make;
});
