/**
 * Download mode embedder for the JW Player
 * @author Zach
 * @version 5.5
 */
(function(jwplayer) {
	var embed = jwplayer.embed,
		_utils = jwplayer.utils,
		_css = _utils.css,
		
		JW_CSS_CURSOR = "pointer",
		JW_CSS_NONE = "none",
		JW_CSS_BLOCK = "block",
		JW_CSS_100PCT = "100%",
		JW_CSS_ABSOLUTE = "absolute";
	
	embed.download = function(_container, _options) {
		var params = _utils.extend({}, _options),
			_display,
			_width = params.width ? params.width : 480,
			_height = params.height ? params.height : 320,
			_file, 
			_image,
			_logo = _options.logo ? _options.logo : {
				prefix: 'http://l.longtailvideo.com/download/',
				file: 'logo.png',
				margin: 10
			};


		function _embed() {
			if (params.playlist && params.playlist.length) {
				try {
					_file = params.playlist[0].sources[0].file;
					_image = params.playlist[0].image;
				} catch(e) {
					return;
				}
			} else {
				return;
			}
			
			if (_logo.prefix) {
				_logo.prefix += jwplayer.version.split(/\W/).splice(0, 2).join("/") + "/";
			}
			
			_styleElements();
			_buildElements();
		}
		
		function _buildElements() {
			if (_container) {
				_display = _createElement("a", "display", _container);
				_createElement("div", "iconbackground", _display);
				_createElement("div", "icon", _display);
				_createElement("div", "logo", _display);
				if (_file) {
					_display.setAttribute("href", _utils.getAbsolutePath(_file));
				}
			}
		}
		
		function _styleElements() {
			
			var _prefix = "#" + _container.id + " .jwdownload";

			_css(_prefix+"display", {
				width: _width,
				height: _height,
				background: "black center no-repeat " + (_image ? 'url('+_image+')' : ""),
				'background-size': "contain",
				position: JW_CSS_ABSOLUTE,
				border: JW_CSS_NONE,
				display: JW_CSS_BLOCK
			});

			_css(_prefix+"display div", {
				position: JW_CSS_ABSOLUTE,
				width: JW_CSS_100PCT,
				height: JW_CSS_100PCT
			});

			_css(_prefix+"logo", {
				bottom: _logo.margin,
				left: _logo.margin,
				background: "bottom left no-repeat url(" + _logo.prefix + _logo.file + ")"
			});
			
			_css(_prefix+"icon", {
				background: "center no-repeat url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAALdJREFUeNrs18ENgjAYhmFouDOCcQJGcARHgE10BDcgTOIosAGwQOuPwaQeuFRi2p/3Sb6EC5L3QCxZBgAAAOCorLW1zMn65TrlkH4NcV7QNcUQt7Gn7KIhxA+qNIR81spOGkL8oFJDyLJRdosqKDDkK+iX5+d7huzwM40xptMQMkjIOeRGo+VkEVvIPfTGIpKASfYIfT9iCHkHrBEzf4gcUQ56aEzuGK/mw0rHpy4AAACAf3kJMACBxjAQNRckhwAAAABJRU5ErkJggg==)"
			});
	
			_css(_prefix+"iconbackground", {
				background: "center no-repeat url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAEpJREFUeNrszwENADAIA7DhX8ENoBMZ5KR10EryckCJiIiIiIiIiIiIiIiIiIiIiIh8GmkRERERERERERERERERERERERGRHSPAAPlXH1phYpYaAAAAAElFTkSuQmCC)"
			});
			
		}
		
		function _createElement(tag, className, parent) {
			var _element = document.createElement(tag);
			_element.className = "jwdownload"+className;
			if (parent) {
				parent.appendChild(_element);
			}
			return _element;
		};
		
		_embed();
	};


	
})(jwplayer);
