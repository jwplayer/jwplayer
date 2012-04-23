/**
 * jwplayer.html5 namespace
 *
 * @author pablo
 * @version 6.0
 */
(function(html5) {
	var _jw = jwplayer, _utils = _jw.utils,

		VIEW_VIDEO_CONTAINER_CLASS = "jwvideocontainer",
		VIEW_CONTROLS_CONTAINER_CLASS = "jwcontrolscontainer";
	
	html5.view = function(api, model) {
		var _api = api,
			_model = model,
			_controls = {},
			_container,
			_videoLayer;
		
		function _init() {
			_container = document.getElementById(_api.id);
			_controls.controlbar = new html5.controlbar(_api);
			
			_videoLayer = document.createElement("span");
			_videoLayer.className = VIEW_VIDEO_CONTAINER_CLASS;
			
			_controlsLayer = document.createElement("span");
			_controlsLayer.className = VIEW_CONTROLS_CONTAINER_CLASS;

			_videoLayer.appendChild(_model.getVideo().getTag());
			_controlsLayer.appendChild(_controls.controlbar.getDisplayElement());
			
			_container.appendChild(_videoLayer);
			_container.appendChild(_controlsLayer);
		}
		
		_init();
	}
	
	_utils.appendStylesheet('.'+VIEW_VIDEO_CONTAINER_CLASS + ' ,.'+VIEW_CONTROLS_CONTAINER_CLASS, {
		width: "100%",
		height: "100%",
		display: "inline-block",
		position: "absolute"
	});
	_utils.appendStylesheet('.'+VIEW_VIDEO_CONTAINER_CLASS + " video", {
		width: "100%",
		height: "100%",
		background: "#000",
		opacity: 0,
		'-webkit-transition': 'opacity .15s ease'
	});

})(jwplayer.html5);