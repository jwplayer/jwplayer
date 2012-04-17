/**
 * Main HTMl5 player class
 *
 * @author pablo
 * @version 6.0
 */
(function(html5) {
	html5.player = function(config) {
		var _model, _view, _controller,
			_api = this;
		
		function _init() {
			_model = {
				video: new html5.video(document.createElement("video")),
				settings: config
			};
		
			_api.id = "player";
			_api.settings = _model.settings;

			_view = {
				container: document.getElementById(_api.id),
				controlbar: new html5.controlbar(_api, _model.settings)
			};
			
			_controller = new html5.controller(_model, _view);
		
			jwplayer.utils.appendStylesheet("#"+_api.id+" video", {
				width: "100%",
				height: "100%",
				background: "#000",
				display: "none"
			});
			
			_view.container.appendChild(_model.video.getTag());
			_view.container.appendChild(_view.controlbar.getDisplayElement());
			
		}
		
		this.jwPlay = function(){ _controller.play() };
		this.jwPause = function(){ _controller.pause() };
		this.jwStop = function(){ _controller.stop() };
		
		_init();
	}
})(jwplayer.html5);

