define([
    'utils/helpers',
    'utils/backbone.events',
    'underscore'
], function(utils, Events, _) {

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


    /**
     * Recursively traverses nested object, replacing key names containing a
     * search string with a replacement string.
     *
     * @param searchString
     *            The string to search for in the object's key names
     * @param replaceString
     *            The string to replace in the object's key names
     * @returns Object.
     */
    /*
    var _deepReplaceKeyName = function (obj, searchString, replaceString) {
        switch (utils.typeOf(obj)) {
            case 'array':
                for (var i = 0; i < obj.length; i++) {
                    obj[i] = _deepReplaceKeyName(obj[i],
                        searchString, replaceString);
                }
                break;
            case 'object':
                _.each(obj, function (val, key) {
                    var searches;
                    if (searchString instanceof Array && replaceString instanceof Array) {
                        if (searchString.length !== replaceString.length) {
                            return;
                        } else {
                            searches = searchString;
                        }
                    } else {
                        searches = [searchString];
                    }
                    var newkey = key;
                    for (var i = 0; i < searches.length; i++) {
                        newkey = newkey.replace(new RegExp(searchString[i], 'g'), replaceString[i]);
                    }
                    obj[newkey] = _deepReplaceKeyName(val, searchString, replaceString);
                    if (key !== newkey) {
                        delete obj[key];
                    }
                });
                break;
        }
        return obj;
    };
    */

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
                '</object>';

            // TODO: check id
            swf = container.getElementsByTagName('object')[0];

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

            container.appendChild(swf, container);
        }

        swf.className = 'jwswf';
        swf.style.position = 'relative';
        swf.style.display = 'block';

        // flash can trigger events
        _.extend(swf, Events);

        /*
        // Intercept trigger events, normalize them, then send along
        swf.trigger = function() {
            return Events.trigger.apply(this, _deepReplaceKeyName(arguments));
        };
        */

        // javascript can trigger SwfEventRouter callbacks
        swf.triggerFlash = function(name) {
            var args = Array.prototype.slice.call(arguments, 1);
            var status = utils.tryCatch(function() {
                if (args.length) {
                    var json = JSON.stringify(args);
                    swf.__externalCall(name, json);
                } else {
                    swf.__externalCall(name);
                }
            });

            if (status instanceof utils.Error) {
                console.error(status);
            }
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
