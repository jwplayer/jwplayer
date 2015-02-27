define([
    'utils/helpers'
], function(utils) {

    return function(container, message, config) {
        var style = container.style;
        style.backgroundColor = '#000';
        style.color = '#FFF';
        style.width = utils.styleDimension(config.width);
        style.height = utils.styleDimension(config.height);
        style.display = 'table';
        style.opacity = 1;

        var text = document.createElement('p'),
            textStyle = text.style;
        textStyle.verticalAlign = 'middle';
        textStyle.textAlign = 'center';
        textStyle.display = 'table-cell';
        textStyle.font = '15px/20px Arial, Helvetica, sans-serif';
        text.innerHTML = message.replace(':', ':<br>');

        container.innerHTML = '';
        container.appendChild(text);
    };
});
