/**
 * JW Player html5 right-click
 *
 * @author pablo
 * @version 6.0
 */
(function(html5) {
	var utils = jwplayer.utils,
		_css = utils.css,
		
		FREE = "free",
		PRO = "pro",
		PREMIUM = "premium",
		ADS = "ads",
		ABOUT_DEFAULT = "About JW Player ",
		LINK_DEFAULT = "http://www.longtailvideo.com/jwpabout/?a=right-click&v=",

		DOCUMENT = document,
		RC_CLASS = ".jwclick",
		RC_ITEM_CLASS = RC_CLASS + "_item",

		/** Some CSS constants we should use for minimization **/
		JW_CSS_100PCT = "100%",
		JW_CSS_NONE = "none",
		JW_CSS_BOX_SHADOW = "5px 5px 7px rgba(0,0,0,.10), 0px 1px 0px rgba(255,255,255,.3) inset",
		JW_CSS_WHITE = "#FFF";
	
	html5.rightclick = function(api, config) {
		var _api = api,
			_container,// = DOCUMENT.getElementById(_api.id),
			_linkFlag = "f",
			_config = utils.extend({
				aboutlink: LINK_DEFAULT+html5.version+_linkFlag+'&m=html5',
				abouttext: ABOUT_DEFAULT + html5.version + '...'
			}, config),
			_mouseOverContext = false,
			_menu,
			_about;
			
		function _init() {
			_container = DOCUMENT.getElementById(_api.id);
			_menu = _createElement(RC_CLASS);
			_menu.id = _api.id + "_menu";
			_menu.style.display = JW_CSS_NONE;
	        _container.oncontextmenu = _showContext;
	        _menu.onmouseover = function() { _mouseOverContext = true; };
	        _menu.onmouseout = function() { _mouseOverContext = false; };
	        DOCUMENT.addEventListener("mousedown", _hideContext, false);
	        _about = _createElement(RC_ITEM_CLASS);

	        var edition = _getEdition();
	        _linkFlag = _getLinkFlag(edition);
	        if (edition != FREE && edition.length != 0) {
        		edition = edition.charAt(0).toUpperCase() + edition.substr(1);
        		_config.abouttext = ABOUT_DEFAULT + html5.version + ' (' + edition + ' edition) ...';
        		_config.aboutlink = LINK_DEFAULT+html5.version+_linkFlag+'&m=html5';
	        }
	        _about.innerHTML = _config.abouttext;
	        _about.onclick = _clickHandler;
	        _menu.appendChild(_about);
	        DOCUMENT.body.appendChild(_menu);
		}

		function _getEdition() {
			if (jwplayer().config.key) {
				var	licenseKey = new utils.key(jwplayer().config.key);
				return licenseKey.edition();
			}
			else {
				return "";
			}
		}

		function _getLinkFlag(edition) {
			if (edition == PRO) {
				return "p";
			}
			else if (edition == PREMIUM) {
				return "r";
			}
			else if (edition == ADS) {
				return "a";
			}
			else {
				return "f";
			}
		}
		
		function _createElement(className) {
			var elem = DOCUMENT.createElement("div");
			elem.className = className.replace(".", "");
			return elem;
		}
		
		function _clickHandler() {
			window.location.href = _config.aboutlink;
		}
		
	    function _showContext(evt) {
	        if (_mouseOverContext) {
	            // returning because _mouseOverContext is true, indicating the mouse is over the menu
	            return;
	        }

	        // IE doesn't pass the event object
	        if (evt == null) evt = window.event;

	        // we assume we have a standards compliant browser, but check if we have IE
	        // Also, document.body.scrollTop does not work in IE
	        var target = evt.target != null ? evt.target : evt.srcElement,
	        	scrollTop = DOCUMENT.body.scrollTop ? DOCUMENT.body.scrollTop : DOCUMENT.documentElement.scrollTop,
	        	scrollLeft = DOCUMENT.body.scrollLeft ? DOCUMENT.body.scrollLeft : DOCUMENT.documentElement.scrollLeft;

	        // hide the menu first to avoid an "up-then-over" visual effect
	        _menu.style.display = JW_CSS_NONE;
	        _menu.style.left = evt.clientX + scrollLeft + 'px';
	        _menu.style.top = evt.clientY + scrollTop + 'px';
	        _menu.style.display = 'block';
	        evt.preventDefault();
	    }

	    function _hideContext() {
	        if (_mouseOverContext) {
	            // returning because _mouseOverContext is true, indicating the mouse is over the menu
	            return;
	        }
	        else {
	            _menu.style.display = JW_CSS_NONE;
	        }
	    }

		this.element = function() {
			return _menu;
		}
		
		_init();
	};
	
	_css(RC_CLASS, {
		'background-color': JW_CSS_WHITE,
		'-webkit-border-radius': 5,
		'-moz-border-radius': 5,
		'border-radius': 5,
		height: "auto",
		border: "1px solid #bcbcbc",
		'font-family': '"MS Sans Serif", "Geneva", sans-serif',
		'font-size': 10,
		width: 200,
		'-webkit-box-shadow': JW_CSS_BOX_SHADOW,
		'-moz-box-shadow': JW_CSS_BOX_SHADOW,
		'box-shadow': JW_CSS_BOX_SHADOW,
		position: "absolute",
		'z-index': 999,
	}, true);
	
	
	
	_css(RC_ITEM_CLASS, {
		padding: "8px 21px",
		'text-align': 'left',
		cursor: "pointer"
	}, true);

	_css(RC_ITEM_CLASS + ":hover", {
		"background-color": "#595959",
		color: JW_CSS_WHITE
	}, true);

	_css(RC_ITEM_CLASS + " a", {
		'text-decoration': JW_CSS_NONE,
		color: "#000"
	}, true);
	
	_css(RC_CLASS + " hr", {
		width: JW_CSS_100PCT,
		padding: 0,
		margin: 0,
		border: "1px #e9e9e9 solid"
	}, true);

})(jwplayer.html5);