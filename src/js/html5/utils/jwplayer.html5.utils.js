/**
 * HTML5-only utilities for the JW Player.
 * 
 * @author pablo
 * @version 6.0
 */
(function(utils) {
	var DOCUMENT = document, WINDOW = window;
	

	/**
	 * Cleans up a css dimension (e.g. '420px') and returns an integer.
	 */
	utils.parseDimension = function(dimension) {
		if (typeof dimension == "string") {
			if (dimension === "") {
				return 0;
			} else if (dimension.lastIndexOf("%") > -1) {
				return dimension;
			} else {
				return parseInt(dimension.replace("px", ""), 10);
			}
		}
		return dimension;
	}

	/** Format the elapsed / remaining text. **/
	utils.timeFormat = function(sec) {
		if (sec > 0) {
			var hrs = Math.floor(sec / 3600),
				mins = Math.floor((sec - hrs*3600) / 60),
				secs = Math.floor(sec % 60);
				
			return (hrs ? hrs + ":" : "") 
					+ (mins < 10 ? "0" : "") + mins + ":"
					+ (secs < 10 ? "0" : "") + secs;
		} else {
			return "00:00";
		}
	}
	


	/** Replacement for getBoundingClientRect, which isn't supported in iOS 3.1.2 **/
/*
	utils.bounds = function(element) {
		if (!element) return {
			left: 0,
			right: 0,
			width: 0,
			height: 0,
			top: 0,
			bottom: 0
		};
		
		var obj = element,
			left = 0,
			top = 0,
			width = isNaN(element.offsetWidth) ? 0 : element.offsetWidth,
			height = isNaN(element.offsetHeight) ? 0 : element.offsetHeight;
		
		do {
			left += isNaN(obj.offsetLeft) ? 0 : obj.offsetLeft;
			top += isNaN(obj.offsetTop) ? 0 : obj.offsetTop;
		} while (obj = obj.offsetParent);
		
		return { 
			left: left, 
			top: top,
			width: width,
			height: height,
			right: left + width,
			bottom: top + height
		};
	}
	*/
	utils.bounds = function(element) {
		try { 
			return element.getBoundingClientRect(element);
		} catch (e) {
			return {
				left: 0,
				right: 0,
				width: 0,
				height: 0,
				top: 0,
				bottom: 0
			};
		}
	}
	
	
	utils.empty = function(element) {
		if (!element) return;
		while (element.childElementCount > 0) {
			element.removeChild(element.children[0]);
		}
	}

})(jwplayer.utils);