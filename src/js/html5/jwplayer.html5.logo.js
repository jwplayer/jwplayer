/**
 * JW Player logo component
 *
 * @author zach
 * @modified pablo
 * @version 6.0
 */
(function(jwplayer) {
	var utils = jwplayer.utils,
		html5 = jwplayer.html5,
		_css = utils.css,
	
		_defaults = {
			prefix: "http://l.longtailvideo.com/html5/",
			file: "logo.png",
			link: "http://www.longtailvideo.com/players/jw-flv-player/",
			linktarget: "_top",
			margin: 8,
//			out: 0.5,
//			over: 1,
//			timeout: 5,
			hide: true,
			position: "top-right"
		},
		
		UNDEFINED = undefined,
		
		JW_CSS_VISIBLE = "visible",
		JW_CSS_HIDDEN = "hidden",
		LOGO_CLASS = ".jwlogo";
	
	
	html5.logo = function(api, logoConfig) {
		var _api = api,
			_id = _api.id + "_logo",
			_settings,
			_logo,
			_showing = false;
		
		function _setup() {
			_setupConfig();
			_setupDisplayElements();
			//_setupMouseEvents();
		}
		
		function _setupConfig() {
			if (_defaults.prefix) {
				var version = jwplayer.version.split(/\W/).splice(0, 2).join("/");
				if (_defaults.prefix.indexOf(version) < 0) {
					_defaults.prefix += version + "/";
				}
			}
			try {
				if (window.location.href.indexOf("https") == 0) {
					_defaults.prefix = _defaults.prefix.replace("http://l.longtailvideo.com", "https://securel.longtailvideo.com");
				}
			} catch(e) {}
			
			_settings = utils.extend({}, _defaults, logoConfig);
			_settings.hide = (_settings.hide.toString() == "true");
		}
		
		function _setupDisplayElements() {
			_logo = document.createElement("img");
			_logo.className = "jwlogo";
			_logo.id = _id;
			
			if (!_settings.file) {
				return;
			}
			
			var positions = (/(\w+)-(\w+)/).exec(_settings.position),
				style = {
					opacity: _settings.hide ? UNDEFINED : 1,
					visibility: _settings.hide ? UNDEFINED : JW_CSS_VISIBLE
				},
				margin = _settings.margin;

			if (positions.length == 3) {
				style[positions[1]] = margin;
				style[positions[2]] = margin;
			} else {
				style.top = style.right = margin;
			}

			_css(_internalSelector(), style); 
			
			if (_settings.file.indexOf("/") >= 0) {
				_logo.src = _settings.file;
			} else {
				_logo.src = _settings.prefix + _settings.file;
			}
			
			_logo.onclick = _clickHandler;
		}
		
		this.resize = function(width, height) {
		};
		
		this.element = function() {
			return _logo;
		};
		
//		function _setupMouseEvents() {
//			if (_settings.link) {
//				
//			}
//		}
//		
		this.offset = function(offset) {
			_css(_internalSelector(), { 'margin-bottom': offset }); 
		}
		
		this.position = function() {
			return _settings.position;
		}

		this.margin = function() {
			return parseInt(_settings.margin);
		}

		function _clickHandler(evt) {
			if (utils.exists(evt)) {
				evt.stopPropagation();
			}
			
			if (_showing && _settings.link) {
				_api.jwPause();
				_api.jwSetFullscreen(false);
				window.open(_settings.link, _settings.linktarget);
			}
			return;
		}
		
		function _internalSelector(selector) {
			return "#" + _id + " " + (selector ? selector : "");
		}
		
		this.hide = function() {
			if (_settings.hide) {
				_showing = false;
				_css(_internalSelector(), {
					opacity: 0,
					visibility: JW_CSS_HIDDEN,
				});
			}
		}

		this.show = function() {
			_showing = true;
			_css(_internalSelector(), {
				visibility: JW_CSS_VISIBLE,
				opacity: 1
			});
		}
		
		_setup();
		
		return this;
	};
	
	_css(LOGO_CLASS, {
		cursor: "pointer",
	  	position: "absolute",
	  	visibility: JW_CSS_HIDDEN,
	  	opacity: 0
	});

	utils.transitionStyle(LOGO_CLASS, "visibility .15s, opacity .15s");

})(jwplayer);
