/**
 * JW Player html5 right-click
 *
 * @author pablo
 * @version 6.0
 */
(function(html5) {
	var utils = jwplayer.utils,
		_css = utils.css,

		ABOUT_DEFAULT = "About JW Player ",
		LINK_DEFAULT = "http://www.longtailvideo.com/jwpabout/?a=r&v=",

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
			_config = utils.extend({
				aboutlink: LINK_DEFAULT+html5.version+'&m=h&e=o',
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
	        _about.innerHTML = _config.abouttext;
	        _about.onclick = _clickHandler;
	        _menu.appendChild(_about);
	        _container.appendChild(_menu);
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
	        	bounds = utils.bounds(_container),
	        	scrollTop = bounds.top,// ? DOCUMENT.body.scrollTop : DOCUMENT.documentElement.scrollTop,
	        	scrollLeft = bounds.left;// ? DOCUMENT.body.scrollLeft : DOCUMENT.documentElement.scrollLeft;

	        // hide the menu first to avoid an "up-then-over" visual effect
	        _menu.style.display = JW_CSS_NONE;
	        _menu.style.left = evt.pageX - scrollLeft + 'px';
	        _menu.style.top = evt.pageY - scrollTop + 'px';
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
		width: 320,
		'-webkit-box-shadow': JW_CSS_BOX_SHADOW,
		'-moz-box-shadow': JW_CSS_BOX_SHADOW,
		'box-shadow': JW_CSS_BOX_SHADOW,
		position: "absolute",
		'z-index': 999,
	}, true);

	_css(RC_CLASS + " div", {
		padding: "8px 21px",
		margin: '0px',
		'background-color': JW_CSS_WHITE,
		border: "none",
		'font-family': '"MS Sans Serif", "Geneva", sans-serif',
		'font-size': 10,
		color: 'inherit'
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