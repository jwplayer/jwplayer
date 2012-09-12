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
	
		UNDEFINED = undefined,
		
		JW_CSS_VISIBLE = "visible",
		JW_CSS_HIDDEN = "hidden",
		LOGO_CLASS = ".jwlogo";
	
	
	var logo = html5.logo = function(api, logoConfig) {
		var _api = api,
			_id = _api.id + "_logo",
			_settings,
			_logo,
			_defaults = logo.defaults,
			_showing = false;
		
		function _setup() {
			_setupConfig();
			_setupDisplayElements();
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
				_logo.style.opacity = 0;
			}
		}

		this.show = function() {
			_showing = true;
			_logo.style.opacity = 1;
		}
		
		_setup();
		
		return this;
	};
	
	logo.defaults = {
		prefix: "http://l.longtailvideo.com/html5/",
		file: "logo.png",
		link: "http://www.longtailvideo.com/players/jw-flv-player/",
		linktarget: "_top",
		margin: 8,
		hide: true,
		position: "top-right"
	};
	
	_css(LOGO_CLASS, {
		cursor: "pointer",
	  	position: "absolute",
	  	opacity: 0
	});

	utils.transitionStyle(LOGO_CLASS, "visibility .15s, opacity .15s");

})(jwplayer);
