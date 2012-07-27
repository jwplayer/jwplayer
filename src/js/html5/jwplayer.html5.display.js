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
		_css = utils.css,
		

		DOCUMENT = document,
		D_CLASS = ".jwdisplay",
		D_PREVIEW_CLASS = ".jwpreview",
		D_ERROR_CLASS = ".jwerror",

		/** Some CSS constants we should use for minimization **/
		JW_CSS_ABSOLUTE = "absolute",
		JW_CSS_NONE = "none",
		JW_CSS_100PCT = "100%",
		JW_CSS_HIDDEN = "hidden",
		JW_CSS_SMOOTH_EASE = "opacity .25s, background .25s, color .25s";

	
	html5.display = function(api, config) {
		var _api = api,
			_skin = api.skin,
			_display, _preview,
			_item,
			_image, _imageWidth, _imageHeight, _imageURL,
			_icons = {},
			_errorState = false,
			_completedState = false,
			_hiding,
			_button,		
			_config = utils.extend({
				backgroundcolor: '#000',
				showicons: true,
				bufferrotation: 15,
				bufferinterval: 100,
				fontcase: "",
				fontcolor: '#fff',
				overcolor: '#fff',
				fontsize: 15,
				fontweight: ""
			}, _skin.getComponentSettings('display'), config);
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
			_api.jwAddEventListener(events.JWPLAYER_PLAYLIST_COMPLETE, _playlistCompleteHandler);
			_api.jwAddEventListener(events.JWPLAYER_MEDIA_ERROR, _errorHandler);

			_display.addEventListener('click', _clickHandler, false);
			
			_createIcons();
			//_createTextFields();
			
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
		
		function _createIcons() {
			var	outStyle = {
					font: _config.fontweight + " " + _config.fontsize + "px/"+(parseInt(_config.fontsize)+3)+"px Arial,Helvetica,sans-serif",
					color: _config.fontcolor
				},
				overStyle = {color:_config.overcolor};
			_button = new html5.displayicon(_display.id+"_button", _api, outStyle, overStyle);
			_display.appendChild(_button.element());
		}
		

		function _setIcon(name, text) {
			if (!_config.showicons) return;
			
			if (name || text) {
				_button.setRotation(name == "buffer" ? parseInt(_config.bufferrotation) : 0, parseInt(_config.bufferinterval));
				_button.setIcon(name);
				_button.setText(text);
			} else {
				_button.hide();
			}
			
			
		}

		function _itemHandler() {
			_item = _api.jwGetPlaylist()[_api.jwGetPlaylistIndex()];
			var newImage = _item ? _item.image : "";
			if (_image != newImage) {
				_image = newImage;
				_setVisibility(D_PREVIEW_CLASS, false);
				_getImage();
			}
		}
		
		function _playlistCompleteHandler() {
			_completedState = true;
			_setIcon("replay");
		}
		
		var _stateTimeout;
		
		function _stateHandler(evt) {
			clearTimeout(_stateTimeout);
			_stateTimeout = setTimeout(function() {
				_updateDisplay(evt.newstate);
			}, 100);
		}
		
		function _updateDisplay(state) {
			if (_button) _button.setRotation(0);
			switch(state) {
			case states.IDLE:
				if (!_errorState && !_completedState) {
					if (_image) _setVisibility(D_PREVIEW_CLASS, true);
					_setIcon('play', _item ? _item.title : "");
				}
				break;
			case states.BUFFERING:
				_clearError();
				_completedState = false;
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

		this.element = function() {
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
				_css(_internalSelector(D_PREVIEW_CLASS), { 'background-image': undefined });
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

		function _errorHandler(evt) {
			_errorState = true;
			_setIcon('error', evt.message);
		}
		
		function _clearError() {
			_errorState = false;
			if (_icons.error) _icons.error.setText();
		}

		
		function _redraw() {
			utils.stretch(_api.jwGetStretching(), _preview, _display.clientWidth, _display.clientHeight, _imageWidth, _imageHeight);
		}

		this.redraw = _redraw;
		
		function _setVisibility(selector, state) {
			_css(_internalSelector(selector), {
				opacity: state ? 1 : 0,
				visibility: state ? "visible" : "hidden"
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
		overflow: JW_CSS_HIDDEN,
		opacity: 0
	});

	_css(D_CLASS + ' .jwpreview', {
		position: JW_CSS_ABSOLUTE,
		width: JW_CSS_100PCT,
		height: JW_CSS_100PCT,
		background: 'no-repeat center',
		overflow: JW_CSS_HIDDEN
	});

	_css(D_CLASS +', '+D_CLASS + ' *', {
    	'-webkit-transition': JW_CSS_SMOOTH_EASE,
    	'-moz-transition': JW_CSS_SMOOTH_EASE,
    	'-o-transition': JW_CSS_SMOOTH_EASE
	});

})(jwplayer.html5);