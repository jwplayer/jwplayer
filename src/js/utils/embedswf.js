define([
    'utils/helpers'
], function(utils) {

    // Defaults
    var BGCOLOR = '#000000';

    // Only html5 compatible attr
    //  http://www.w3schools.com/tags/tag_object.asp
    /*
    var validObjectAttr = [
        'data',
        'form',
        'height',
        'name',
        'type',
        'usemap',
        'width'
    ];
    */

    function appendParam(object, name, value) {
        var param = document.createElement('param');
        param.setAttribute('name', name);
        param.setAttribute('value', value);
        object.appendChild(param);
    }

    function embed(_swfUrl, _container, id, wmode) {
        var swf;

        wmode = wmode || 'opaque';

        if (utils.isMSIE()) {
            // IE8 works best with outerHTML
            var _wrapper = document.createElement('div');
            _container.appendChild(_wrapper);
            _wrapper.outerHTML = '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"' +
                ' width="100%" height="100%" id="' + id +
                '" name="' + id +
                '" tabindex="0">' +
                '<param name="movie" value="' + _swfUrl + '">' +
                '<param name="allowfullscreen" value="true">' +
                '<param name="allowscriptaccess" value="always">' +
                '<param name="seamlesstabbing" value="true">' +
                '<param name="wmode" value="' + wmode + '">' +
                '<param name="bgcolor" value="' + BGCOLOR + '">' +
                '</object>';


            _wrapper.style.position = 'relative';
            _wrapper.style.display = 'block';

            swf = _wrapper;
        } else {
            swf = document.createElement('object');
            swf.setAttribute('type', 'application/x-shockwave-flash');
            swf.setAttribute('data', _swfUrl);
            swf.setAttribute('width', '100%');
            swf.setAttribute('height', '100%');
            swf.setAttribute('bgcolor', BGCOLOR);
            swf.setAttribute('id', id);
            swf.setAttribute('name', id);
            swf.className = 'jwswf';
            //obj.setAttribute('tabindex', 0);
            appendParam(swf, 'allowfullscreen', 'true');
            appendParam(swf, 'allowscriptaccess', 'always');
            appendParam(swf, 'seamlesstabbing', 'true');
            appendParam(swf, 'wmode', wmode);

            _container.appendChild(swf, _container);
        }

        return swf;
    }

    var EmbedSwf = {
        embed : embed
    };

    return EmbedSwf;
});
