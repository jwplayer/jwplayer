(function(utils) {
    /*jshint maxparams:6*/

    /** Stretching options **/
    var _stretching = utils.stretching = {
        NONE: 'none',
        FILL: 'fill',
        UNIFORM: 'uniform',
        EXACTFIT: 'exactfit'
    };

    utils.scale = function(domelement, xscale, yscale, xoffset, yoffset) {
        var value = '';

        // Set defaults
        xscale = xscale || 1;
        yscale = yscale || 1;
        xoffset = xoffset | 0;
        yoffset = yoffset | 0;

        if (xscale !== 1 || yscale !== 1) {
            value = 'scale(' + xscale + ', ' + yscale + ')';
        }
        if (xoffset || yoffset) {
            if (value) {
                value += ' ';
            }
            value = 'translate(' + xoffset + 'px, ' + yoffset + 'px)';
        }
        utils.transform(domelement, value);
    };

    /**
     * Stretches domelement based on stretching. parentWidth, parentHeight,
     * elementWidth, and elementHeight are required as the elements dimensions
     * change as a result of the stretching. Hence, the original dimensions must
     * always be supplied.
     *
     * @param {String}
     *            stretching
     * @param {DOMElement}
     *            domelement
     * @param {Number}
     *            parentWidth
     * @param {Number}
     *            parentHeight
     * @param {Number}
     *            elementWidth
     * @param {Number}
     *            elementHeight
     */
    utils.stretch = function(stretching, domelement, parentWidth, parentHeight, elementWidth, elementHeight) {
        if (!domelement) {
            return false;
        }
        if (!parentWidth || !parentHeight || !elementWidth || !elementHeight) {
            return false;
        }
        stretching = stretching || _stretching.UNIFORM;

        var xscale = Math.ceil(parentWidth / 2) * 2 / elementWidth,
            yscale = Math.ceil(parentHeight / 2) * 2 / elementHeight,
            video = (domelement.tagName.toLowerCase() === 'video'),
            scale = false,
            stretchClass = 'jw' + stretching.toLowerCase();

        switch (stretching.toLowerCase()) {
            case _stretching.FILL:
                if (xscale > yscale) {
                    yscale = xscale;
                } else {
                    xscale = yscale;
                }
                scale = true;
                break;
            case _stretching.NONE:
                xscale = yscale = 1;
                /* falls through */
            case _stretching.EXACTFIT:
                scale = true;
                break;
            case _stretching.UNIFORM:
                /* falls through */
            default:
                if (xscale > yscale) {
                    if (elementWidth * yscale / parentWidth > 0.95) {
                        scale = true;
                        stretchClass = 'jwexactfit';
                    } else {
                        elementWidth = elementWidth * yscale;
                        elementHeight = elementHeight * yscale;
                    }
                } else {
                    if (elementHeight * xscale / parentHeight > 0.95) {
                        scale = true;
                        stretchClass = 'jwexactfit';
                    } else {
                        elementWidth = elementWidth * xscale;
                        elementHeight = elementHeight * xscale;
                    }
                }
                if (scale) {
                    xscale = Math.ceil(parentWidth / 2) * 2 / elementWidth;
                    yscale = Math.ceil(parentHeight / 2) * 2 / elementHeight;
                }
        }

        if (video) {
            var style = {
                left: '',
                right: '',
                width: '',
                height: ''
            };
            if (scale) {
                if (parentWidth < elementWidth) {
                    style.left =
                        style.right = Math.ceil((parentWidth - elementWidth) / 2);
                }
                if (parentHeight < elementHeight) {
                    style.top =
                        style.bottom = Math.ceil((parentHeight - elementHeight) / 2);
                }
                style.width = elementWidth;
                style.height = elementHeight;
                utils.scale(domelement, xscale, yscale, 0, 0);
            } else {
                scale = false;
                utils.transform(domelement);
            }
            utils.css.style(domelement, style);
        } else {
            domelement.className = domelement.className.replace(/\s*jw(none|exactfit|uniform|fill)/g, '') +
                ' ' + stretchClass;
        }
        return scale;
    };

})(jwplayer.utils);
