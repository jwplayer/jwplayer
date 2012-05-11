/**
 * Utility methods for the JW Player.
 *
 * @author pablo
 * @version 6.0
 */
(function(utils) {
	var animations = utils.animations = function() {
	};
	

	animations.rotate = function(domelement, deg) {
		utils.transform(domelement, "rotate(" + deg + "deg)");
	};
	
})(jwplayer.utils);
