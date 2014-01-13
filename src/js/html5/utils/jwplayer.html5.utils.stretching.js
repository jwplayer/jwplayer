/**
 * Utility methods for the JW Player.
 * 
 * @author pablo
 * @version 6.0
 */
(function(utils) {
	
	/** Stretching options **/
	var _stretching = utils.stretching = {
		NONE : "none",
		FILL : "fill",
		UNIFORM : "uniform",
		EXACTFIT : "exactfit"
	};

	utils.scale = function(domelement, xscale, yscale, xoffset, yoffset) {
		var value;
		
		// Set defaults
		xscale = xscale || 1;
		yscale = yscale || 1;
		xoffset = xoffset|0;
		yoffset = yoffset|0;
		
		if (xscale === 1 && yscale === 1 && xoffset === 0 && yoffset === 0) {
			value = "";
		} else {
			value = "scale("+xscale+", "+yscale+") translate("+xoffset+"px, "+yoffset+"px)";
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
		if (!domelement) return false;
		if (!parentWidth || !parentHeight || !elementWidth || !elementHeight) return false;
		stretching = stretching || _stretching.UNIFORM;
		
		var xscale = parentWidth / elementWidth,
			yscale = parentHeight / elementHeight,
			xoff = 0, yoff = 0,
			video = (domelement.tagName.toLowerCase() === "video"),
			scale = false,
			stretchClass;
		
		if (video) {
			utils.transform(domelement);
		}

		stretchClass = "jw" + stretching.toLowerCase();
		
		switch (stretching.toLowerCase()) {
		case _stretching.FILL:
			if (xscale > yscale) {
				elementWidth = elementWidth * xscale;
				elementHeight = elementHeight * xscale;
			} else {
				elementWidth = elementWidth * yscale;
				elementHeight = elementHeight * yscale;
			}
			/* falls through */
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
					stretchClass = "jwexactfit";
				} else {
					elementWidth = elementWidth * yscale;
					elementHeight = elementHeight * yscale;
				}
			} else {
				if (elementHeight * xscale / parentHeight > 0.95) {
					scale = true;
					stretchClass = "jwexactfit";
				} else {
					elementWidth = elementWidth * xscale;
					elementHeight = elementHeight * xscale;
				}
			}
			if (scale) {
				yscale = Math.ceil(100 * parentHeight / elementHeight) / 100;
				xscale = Math.ceil(100 * parentWidth / elementWidth) / 100;
			}
			break;
		}

		if (video) {
			var style = {};
			if (scale && !(xscale === 1 && yscale === 1)) {
				style.width = elementWidth;
				style.height = elementHeight; 
				xoff = ((parentWidth - elementWidth) / 2) / xscale;
				yoff = ((parentHeight - elementHeight) / 2) / yscale;
				utils.scale(domelement, xscale, yscale, xoff, yoff);
			} else {
				scale = false;
				style.width = '';
				style.height = '';
			}
			utils.css.style(domelement, style);
		} else {
			domelement.className = domelement.className.replace(/\s*jw(none|exactfit|uniform|fill)/g, "") +  " " + stretchClass;
		}
		return scale;
	};

})(jwplayer.utils);
