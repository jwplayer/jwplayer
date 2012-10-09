/**
 * Utility methods for the JW Player.
 * 
 * @author pablo
 * @version 6.0
 */
(function(utils) {
	utils.scale = function(domelement, xscale, yscale, xoffset, yoffset) {
		var value, exists = utils.exists;
		
		// Set defaults
		if (!exists(xscale)) xscale = 1;
		if (!exists(yscale)) yscale = 1;
		if (!exists(xoffset)) xoffset = 0;
		if (!exists(yoffset)) yoffset = 0;
		
		if (xscale == 1 && yscale == 1 && xoffset == 0 && yoffset == 0) {
			value = "";
		} else {
			value = "scale("+xscale+","+yscale+") translate("+xoffset+"px,"+yoffset+"px)";
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
		if (!domelement) return;
		if (!stretching) stretching = _stretching.UNIFORM;
		if (!parentWidth || !parentHeight || !elementWidth || !elementHeight) return;
		
		var xscale = parentWidth / elementWidth,
			yscale = parentHeight / elementHeight,
			xoff = 0, yoff = 0,
			style = {},
			video = (domelement.tagName.toLowerCase() == "video"),
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
		case _stretching.NONE:
			xscale = yscale = 1;
		case _stretching.EXACTFIT:
			scale = true;
			break;
		case _stretching.UNIFORM:
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
			if (scale) {
				domelement.style.width = elementWidth + "px";
				domelement.style.height = elementHeight + "px"; 
				xoff = ((parentWidth - elementWidth) / 2) / xscale;
				yoff = ((parentHeight - elementHeight) / 2) / yscale;
				utils.scale(domelement, xscale, yscale, xoff, yoff);
			} else {
				domelement.style.width = "";
				domelement.style.height = "";
			}
		} else {
			domelement.className = domelement.className.replace(/\s*jw(none|exactfit|uniform|fill)/g, "");
			domelement.className += " " + stretchClass;
		}
	};
	
	/** Stretching options **/
	var _stretching = utils.stretching = {
		NONE : "none",
		FILL : "fill",
		UNIFORM : "uniform",
		EXACTFIT : "exactfit"
	};

})(jwplayer.utils);
