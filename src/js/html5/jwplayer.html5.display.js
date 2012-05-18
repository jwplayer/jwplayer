/**
 * JW Player display component
 *
 * @author pablo
 * @version 6.0
 */
(function(html5) {
	var utils = jwplayer.utils,
		events = jwplayer.events,
		states = events.state,
		_rotate = utils.animations.rotate,
		_css = utils.css,
		

		DOCUMENT = document,
		D_CLASS = ".jwdisplay",
		D_PREVIEW_CLASS = ".jwpreview",

		/** Some CSS constants we should use for minimization **/
		JW_CSS_ABSOLUTE = "absolute",
		JW_CSS_NONE = "none",
		JW_CSS_100PCT = "100%",
		JW_CSS_SMOOTH_EASE = "opacity .25s";

	
	html5.display = function(api, config) {
		var _api = api,
			_skin = api.skin,
			_display, _preview,
			_image, _imageWidth, _imageHeight, _imageURL,
			_icons = {},
			_hiding,
			_button,		
			_degreesRotated, 
			_rotationInterval, 
			_config = utils.extend({
				backgroundcolor: '#000',
				showicons: true
			}, _skin.getComponentSettings('display'), config);
			_bufferRotation = !utils.exists(_config.bufferrotation) ? 15 : parseInt(_config.bufferrotation, 10), 
			_bufferInterval = !utils.exists(_config.bufferinterval) ? 100 : parseInt(_config.bufferinterval, 10),
			_eventDispatcher = new events.eventdispatcher();
			
		utils.extend(this, _eventDispatcher);
			
		function _init() {
			_display = DOCUMENT.createElement("div");
			_display.id = _api.id + "_display";
			_display.className = "jwdisplay";
			
			_preview = DOCUMENT.createElement("div");
			_preview.className = "jwpreview";
			_display.appendChild(_preview);
			
			_api.jwAddEventListener(events.JWPLAYER_PLAYER_STATE, _stateHandler);
			_api.jwAddEventListener(events.JWPLAYER_PLAYLIST_ITEM, _itemHandler);
			
			_display.addEventListener('click', _clickHandler, false);
			
			_createIcons();
			
			_stateHandler({newstate:states.IDLE});
		}
		
		function _clickHandler(evt) {
			switch (_api.jwGetState()) {
			case states.PLAYING:
			case states.BUFFERING:
				_api.jwPause();
				break;
			default:
				_api.jwPlay();
				break;
			}
			_eventDispatcher.sendEvent(events.JWPLAYER_DISPLAY_CLICK);
		}
		
		// Create the icons which will be displayed inside of the display button
		function _createIcons() {
			var iconNames = ['play', 'buffer'];
			for (var i=0; i<iconNames.length; i++) {
				var iconName = iconNames[i],
					iconOut = _getSkinElement(iconName+"Icon"),
					iconOver = _getSkinElement(iconName+"IconOver"),
					icon = DOCUMENT.createElement("div"),
					bg = _getSkinElement("background"),
					bgOver = _getSkinElement("backgroundOver");
					button = DOCUMENT.createElement("button");
			
				if (iconOut) {
					button.className = "jw" + iconName;
					icon.className = "jwicon";
					button.appendChild(icon);
					
					_buttonStyle('#'+_display.id+' .'+button.className, bg, bgOver);
					_buttonStyle('#'+_display.id+' .'+button.className+' div', iconOut, iconOver);
					
					if (bgOver || iconOver) {
						button.addEventListener('mouseover', _hoverButton(button), false);
						button.addEventListener('mouseout', _hoverOutButton(button), false);
					}
					
					_icons[iconName] = button;
				}
			}
		}
		
		function _hoverButton(button) {
			return function(evt) {
				if (button.className.indexOf("jwhover") < 0) 
					button.className += " jwhover";
				if (button.childNodes[0].className.indexOf("jwhover") < 0)
					button.childNodes[0].className += " jwhover";
			}
		}
		
		function _hoverOutButton(button) {
			return function(evt) {
				button.className = button.className.replace(" jwhover", ""); 
				button.childNodes[0].className = button.childNodes[0].className.replace(" jwhover", "");
			}
		}
		
		function _buttonStyle(selector, out, over) {
			if (!(out && out.src)) {
				return;
			}
			
			_css(selector, { 
				width: out.width,
				height: out.height,
				'margin-left': out.width / -2,
				'margin-top': out.height / -2,
				background: 'url('+ out.src +') center no-repeat'
			});

			if (over && over.src) {
				_css(selector + ".jwhover", {
					background: 'url('+ over.src +') center no-repeat'
				});
			}
		}
		
		function _setIcon(name) {
			if (!_config.showicons) return;
			
			if (_button) {
				_display.removeChild(_button);
			}
			_button = _icons[name];
			if (_button) {
				_display.appendChild(_button);
			}
			
			if (name == "buffer") {
				_degreesRotated = 0;
				_rotationInterval = setInterval(function() {
					_degreesRotated += _bufferRotation;
					_rotate(_button.childNodes[0], _degreesRotated % 360);
				}, _bufferInterval);
			}
		}

		function _itemHandler() {
			var item = _api.jwGetPlaylist()[_api.jwGetPlaylistIndex()];
			var newImage = item ? item.image : "";
			if (_image != newImage) {
				_image = newImage;
				_setVisibility(D_PREVIEW_CLASS, false);
				_getImage();
			}
		}
		
		var _stateTimeout;
		
		function _stateHandler(evt) {
			clearTimeout(_stateTimeout);
			_stateTimeout = setTimeout(function() {
				_updateDisplay(evt.newstate);
			}, 100);
		}
		
		function _updateDisplay(state) {
			clearInterval(_rotationInterval);
			
			switch(state) {
			case states.COMPLETED:
			case states.IDLE:
				_setVisibility(D_PREVIEW_CLASS, true);
				_setIcon('play');
				break;
			case states.BUFFERING:
				_setIcon('buffer');
				break;
			case states.PLAYING:
				_setIcon();
				break;
			case states.PAUSED:
				_setIcon('play');
				break;
			}
		}
		
		this.hidePreview = function(state) {
			_setVisibility(D_PREVIEW_CLASS, !state);
		}

		this.getDisplayElement = function() {
			return _display;
		}
		
		function _internalSelector(selector) {
			return '#' + _display.id + ' ' + selector;
		}
		
		function _getImage() {
			if (_image) {
				// Find image size and stretch exactfit if close enough
				var img = new Image();
				img.addEventListener('load', _imageLoaded, false);
				img.src = _image;
			} else {
				_setVisibility(D_PREVIEW_CLASS, false);
				_imageWidth = _imageHeight = 0;
			}
		}
		
		function _imageLoaded() {
			_imageWidth = this.width;
			_imageHeight = this.height;
			_redraw();
			if (_image) {
				_css(_internalSelector(D_PREVIEW_CLASS), {
					'background-image': 'url('+_image+')' 
				});
			}
		}

		function _getSkinElement(name) {
			var elem = _skin.getSkinElement('display', name); 
			if (elem) {
				return elem;
			}
			return null;
		}
		
		function _redraw() {
			utils.stretch(_api.jwGetStretching(), _preview, _display.clientWidth, _display.clientHeight, _imageWidth, _imageHeight);
		}

		this.redraw = _redraw;
		
		function _setVisibility(selector, state) {
			_css(_internalSelector(selector), {
				opacity: state ? 1 : 0
			});
		}

		this.show = function() {
			_setVisibility('', true);
		}
		
		this.hide = function() {
			_setVisibility('', false);
		}

		this.getBGColor = function() {
			return _config.backgroundcolor;
		}
		
		/** NOT SUPPORTED : Using this for now to hack around instream API **/
		this.setAlternateClickHandler = function(handler) {
			_alternateClickHandler = handler;
		}
		this.revertAlternateClickHandler = function() {
			_alternateClickHandler = undefined;
		}

		_init();
	};
	
	_css(D_CLASS, {
		position: JW_CSS_ABSOLUTE,
		cursor: "pointer",
		width: JW_CSS_100PCT,
		height: JW_CSS_100PCT,
		overflow: 'hidden',
		opacity: 0
	});

	_css(D_CLASS + ' .jwpreview', {
		position: JW_CSS_ABSOLUTE,
		width: JW_CSS_100PCT,
		height: JW_CSS_100PCT,
		background: 'no-repeat center',
		overflow: 'hidden'
	});

	_css(D_CLASS +', '+D_CLASS + ' *', {
    	'-webkit-transition': JW_CSS_SMOOTH_EASE,
    	'-moz-transition': JW_CSS_SMOOTH_EASE,
    	'-o-transition': JW_CSS_SMOOTH_EASE
	});
	
    _css(D_CLASS+' button, ' + D_CLASS+' .jwicon', {
    	border: JW_CSS_NONE,
    	position: JW_CSS_ABSOLUTE,
    	left: "50%",
    	top: "50%",
    	padding: 0,
    	cursor: 'pointer'
    });

})(jwplayer.html5);