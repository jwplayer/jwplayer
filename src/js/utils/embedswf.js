define([
    'utils/helpers',
    'utils/backbone.events',
    'utils/underscore'
], function(utils, Events, _) {

    // Defaults
    var BGCOLOR = '#000000';

    function appendParam(object, name, value) {
        var param = document.createElement('param');
        param.setAttribute('name', name);
        param.setAttribute('value', value);
        object.appendChild(param);
    }

    function embed(swfUrl, container, id, wmode) {
        var swf;

        wmode = wmode || 'opaque';

        if (utils.isMSIE()) {
            // IE8 works best with outerHTML
            var temp = document.createElement('div');
            container.appendChild(temp);

            temp.outerHTML = '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"' +
                ' width="100%" height="100%" id="' + id +
                '" name="' + id +
                '" tabindex="0">' +
                '<param name="movie" value="' + swfUrl + '">' +
                '<param name="allowfullscreen" value="true">' +
                '<param name="allowscriptaccess" value="always">' +
                '<param name="wmode" value="' + wmode + '">' +
                '<param name="bgcolor" value="' + BGCOLOR + '">' +
                '<param name="menu" value="false">' +
                '</object>';

            var objectElements = container.getElementsByTagName('object');
            for (var i = objectElements.length; i--;) {
                if (objectElements[i].id === id) {
                    swf = objectElements[i];
                }
            }

        } else {
            swf = document.createElement('object');
            swf.setAttribute('type', 'application/x-shockwave-flash');
            swf.setAttribute('data', swfUrl);
            swf.setAttribute('width', '100%');
            swf.setAttribute('height', '100%');
            swf.setAttribute('bgcolor', BGCOLOR);
            swf.setAttribute('id', id);
            swf.setAttribute('name', id);

            appendParam(swf, 'allowfullscreen', 'true');
            appendParam(swf, 'allowscriptaccess', 'always');
            appendParam(swf, 'wmode', wmode);
            appendParam(swf, 'menu', 'false');

            container.appendChild(swf, container);
        }

        swf.className = 'jw-swf';
        swf.style.display = 'block';
        swf.style.position = 'absolute';
        swf.style.left = 0;
        swf.style.right = 0;
        swf.style.top = 0;
        swf.style.bottom = 0;

        // flash can trigger events
        _.extend(swf, Events);

        // javascript can trigger SwfEventRouter callbacks
        swf.triggerFlash = function(name) {
            var swfInstance = this;
            if (!swfInstance.__externalCall) {
                console.error('swf is not initialized');
                return swfInstance;
            }
            var args = Array.prototype.slice.call(arguments, 1);
            var status = utils.tryCatch(function() {
                if (args.length) {
                    var json = JSON.stringify(args);
                    swfInstance.__externalCall(name, json);
                } else {
                    swfInstance.__externalCall(name);
                }
            });

            if (status instanceof utils.Error) {
                console.error({command : name, error : status});
            }
            return swfInstance;
        };

        return swf;
    }

    function remove(swf) {
        if (swf && swf.parentNode) {
            swf.style.display = 'none';
            // remove flash object safely, setting flash external interface methods to null for ie8
            if (utils.isMSIE(8)) {
                for (var i in swf) {
                    if (typeof swf[i] === 'function') {
                        swf[i] = null;
                    }
                }
            }
            swf.parentNode.removeChild(swf);
        }
    }

    var EmbedSwf = {
        embed : embed,
        remove : remove
    };

    return EmbedSwf;
});
