/**
 * HTML5-only utilities for the JW Player.
 *
 * @author pablo
 * @version 6.0
 */
(function(utils) {

	/**
	 * Basic serialization: string representations of booleans and numbers are returned typed
	 *
	 * @param {String} val	String value to serialize.
	 * @return {Object}		The original value in the correct primitive type.
	 */
	utils.serialize = function(val) {
		if (val == null) {
			return null;
		} else if (val == 'true') {
			return true;
		} else if (val == 'false') {
			return false;
		} else if (isNaN(Number(val)) || val.length > 5 || val.length == 0) {
			return val;
		} else {
			return Number(val);
		}
	}
	

	
})(jwplayer.utils);