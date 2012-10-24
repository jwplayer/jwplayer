/**
 * Download mode embedder for the JW Player
 * @author Zach
 * @version 5.5
 */
(function(jwplayer) {
	var embed = jwplayer.embed,
		utils = jwplayer.utils,

		DOCUMENT = document,
		
		JW_CSS_CURSOR = "pointer",
		JW_CSS_NONE = "none",
		JW_CSS_BLOCK = "block",
		JW_CSS_100PCT = "100%",
		JW_CSS_RELATIVE = "relative",
		JW_CSS_ABSOLUTE = "absolute";
	
	embed.download = function(_container, _options, _errorCallback) {
		var params = utils.extend({}, _options),
			_display,
			_width = params.width ? params.width : 480,
			_height = params.height ? params.height : 320,
			_file, 
			_image,
			_logo = _options.logo ? _options.logo : {
				prefix: 'http://p.jwpcdn.com/',
				file: 'logo.png',
				margin: 10
			};


		function _embed() {
			var file, image, youtube, i, playlist = params.playlist, item, sources, i,
				types = ["mp4", "aac", "mp3"]; 
			if (playlist && playlist.length) {
				item = playlist[0];
				sources = item.sources;
				// If no downloadable files, and youtube, display youtube
				// If nothing, show error message
				for (i=0; i<sources.length; i++) {
					var source = sources[i], 
						type = source.type ? source.type : utils.extensionmap.extType(utils.extension(source.file));
					if (source.file) {
						for (i in types) {
							if (type == types[i]) {
								file = source.file;
								image = item.image;
							} else if (utils.isYouTube(source.file)) {
								youtube = source.file;
							}
						}

						if (file || youtube) continue;
					}
				}
			} else {
				return;
			}
			
			if (file) {
				_file = file;
				_image = image;
				if (_logo.prefix) {
					if (utils.isHTTPS()) {
						_logo.prefix = _logo.prefix.replace('http://', 'https://ssl.');
					}
					_logo.prefix += jwplayer.version.split(/\W/).splice(0, 2).join("/");
				}
				_buildElements();
				_styleElements();
			} else if (youtube) {
				_embedYouTube(youtube);
			} else {
				_errorCallback();
			}
		}
		
		function _buildElements() {
			if (_container) {
				_display = _createElement("a", "display", _container);
				_createElement("div", "icon", _display);
				_createElement("div", "logo", _display);
				if (_file) {
					_display.setAttribute("href", utils.getAbsolutePath(_file));
				}
			}
		}
		
		function _css(selector, style) {
			var elements = DOCUMENT.querySelectorAll(selector);
			for (var i=0; i<elements.length; i++) {
				for (var prop in style) {
					elements[i].style[prop] = style[prop];
				}
			}
		}
		
		function _styleElements() {
			var _prefix = "#" + _container.id + " .jwdownload";

			_container.style.width = "";
			_container.style.height = "";
			
			_css(_prefix+"display", {
				width: utils.styleDimension(Math.max(320, _width)),
				height: utils.styleDimension(Math.max(180, _height)),
				background: "black center no-repeat " + (_image ? 'url('+_image+')' : ""),
				backgroundSize: "contain",
				position: JW_CSS_RELATIVE,
				border: JW_CSS_NONE,
				display: JW_CSS_BLOCK
			});

			_css(_prefix+"display div", {
				position: JW_CSS_ABSOLUTE,
				width: JW_CSS_100PCT,
				height: JW_CSS_100PCT
			});

			_css(_prefix+"logo", {
				top: _logo.margin + "px",
				right: _logo.margin + "px",
				background: "top right no-repeat url(" + _logo.prefix + _logo.file + ")"
			});
			
			_css(_prefix+"icon", {
				background: "center no-repeat url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAA6/NlyAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAgNJREFUeNrs28lqwkAYB/CZqNVDDj2r6FN41QeIy8Fe+gj6BL275Q08u9FbT8ZdwVfotSBYEPUkxFOoks4EKiJdaDuTjMn3wWBO0V/+sySR8SNSqVRKIR8qaXHkzlqS9jCfzzWcTCYp9hF5o+59sVjsiRzcegSckFzcjT+ruN80TeSlAjCAAXzdJSGPFXRpAAMYwACGZQkSdhG4WCzehMNhqV6vG6vVSrirKVEw66YoSqDb7cqlUilE8JjHd/y1MQefVzqdDmiaJpfLZWHgXMHn8F6vJ1cqlVAkEsGuAn83J4gAd2RZymQygX6/L1erVQt+9ZPWb+CDwcCC2zXGJaewl/DhcHhK3DVj+KfKZrMWvFarcYNLomAv4aPRSFZVlTlcSPA5fDweW/BoNIqFnKV53JvncjkLns/n/cLdS+92O7RYLLgsKfv9/t8XlDn4eDyiw+HA9Jyz2eyt0+kY2+3WFC5hluej0Ha7zQQq9PPwdDq1Et1sNsx/nFBgCqWJ8oAK1aUptNVqcYWewE4nahfU0YQnk4ntUEfGMIU2m01HoLaCKbTRaDgKtaVLk9tBYaBcE/6Artdr4RZ5TB6/dC+9iIe/WgAMYADDpAUJAxjAAAYwgGFZgoS/AtNNTF7Z2bL0BYPBV3Jw5xFwwWcYxgtBP5OkE8i9G7aWGOOCruvauwADALMLMEbKf4SdAAAAAElFTkSuQmCC)"
			});
	
		}
		
		function _createElement(tag, className, parent) {
			var _element = DOCUMENT.createElement(tag);
			if (className) _element.className = "jwdownload"+className;
			if (parent) {
				parent.appendChild(_element);
			}
			return _element;
		};
		
		/** 
		 * Although this function creates a flash embed, the target is iOS, which interprets the embed code as a YouTube video, 
		 * and plays it using the browser
		 */
		function _embedYouTube(path) {
			var embed = _createElement("embed", "", _container);

			/** Left as a dense regular expression for brevity.  Matches the following YouTube URL types:
			 * http://www.youtube.com/watch?v=ylLzyHk54Z0
			 * http://www.youtube.com/watch#!v=ylLzyHk54Z0
			 * http://www.youtube.com/v/ylLzyHk54Z0
			 * http://youtu.be/ylLzyHk54Z0
			 * ylLzyHk54Z0
			 **/
			embed.src = "http://www.youtube.com/v/" + (/v[=\/](\w*)|\/(\w+)$|^(\w+)$/i).exec(path).slice(1).join('');
			embed.type = "application/x-shockwave-flash";
			embed.width = _width;
			embed.height = _height;
		}
		
		_embed();
	};


	
})(jwplayer);
