/**
 * Playlist slider component for the JW Player.
 *
 * @author pablo
 * @version 6.0
 * 
 * TODO: reuse this code for vertical controlbar volume slider
 */
(function(html5) {
	var events = jwplayer.events,
		utils = jwplayer.utils, 
		_css = utils.css,
	
		SLIDER_CLASS = 'jwslider',
		SLIDER_TOPCAP_CLASS = 'jwslidertop',
		SLIDER_BOTTOMCAP_CLASS = 'jwsliderbottom',
		SLIDER_RAIL_CLASS = 'jwrail',
		SLIDER_RAILTOP_CLASS = 'jwrailtop',
		SLIDER_RAILBACK_CLASS = 'jwrailback',
		SLIDER_RAILBOTTOM_CLASS = 'jwrailbottom',
		SLIDER_THUMB_CLASS = 'jwthumb',
		SLIDER_THUMBTOP_CLASS = 'jwthumbtop',
		SLIDER_THUMBBACK_CLASS = 'jwthumbback',
		SLIDER_THUMBBOTTOM_CLASS = 'jwthumbbottom',
	
		DOCUMENT = document,
		WINDOW = window,
		UNDEFINED = undefined,
	
		/** Some CSS constants we should use for minimization **/
		JW_CSS_ABSOLUTE = "absolute",
		JW_CSS_100PCT = "100%";
	
	html5.playlistslider = function(id, skin, parent, pane) {
		var _skin = skin,
			_id = id,
			_pane = pane,
			_wrapper,
			_rail,
			_thumb,
			_dragging,
			_thumbPercent = 0, 
			_dragTimeout, 
			_dragInterval,
			_visible = true,
			
			// Skin elements
			_sliderCapTop,
			_sliderCapBottom,
			_sliderRail,
			_sliderRailCapTop,
			_sliderRailCapBottom,
			_sliderThumb,
			_sliderThumbCapTop,
			_sliderThumbCapBottom,
			
			_topHeight,
			_bottomHeight,
			_redrawTimeout;


		this.element = function() {
			return _wrapper;
		};

		this.visible = function() {
			return _visible;
		};


		function _setup() {	
			var capTop, capBottom;
			
			_wrapper = _createElement(SLIDER_CLASS, null, parent);
			_wrapper.id = id;
			
			_wrapper.addEventListener('mousedown', _startDrag, false);
			_wrapper.addEventListener('click', _moveThumb, false);
			
			_populateSkinElements();
			
			_topHeight = _sliderCapTop.height;
			_bottomHeight = _sliderCapBottom.height;
			
			_css(_internalSelector(), { width: _sliderRail.width });
			_css(_internalSelector(SLIDER_RAIL_CLASS), { top: _topHeight, bottom: _bottomHeight });
			_css(_internalSelector(SLIDER_THUMB_CLASS), { top: _topHeight });
			
			capTop = _createElement(SLIDER_TOPCAP_CLASS, _sliderCapTop, _wrapper);
			capBottom = _createElement(SLIDER_BOTTOMCAP_CLASS, _sliderCapBottom, _wrapper);
			_rail = _createElement(SLIDER_RAIL_CLASS, null, _wrapper);
			_thumb = _createElement(SLIDER_THUMB_CLASS, null, _wrapper);
			
			capTop.addEventListener('mousedown', _scroll(-1), false);
			capBottom.addEventListener('mousedown', _scroll(1), false);
			
			_createElement(SLIDER_RAILTOP_CLASS, _sliderRailCapTop, _rail);
			_createElement(SLIDER_RAILBACK_CLASS, _sliderRail, _rail, true);
			_createElement(SLIDER_RAILBOTTOM_CLASS, _sliderRailCapBottom, _rail);
			_css(_internalSelector(SLIDER_RAILBACK_CLASS), {
				top: _sliderRailCapTop.height,
				bottom: _sliderRailCapBottom.height
			});
			
			_createElement(SLIDER_THUMBTOP_CLASS, _sliderThumbCapTop, _thumb);
			_createElement(SLIDER_THUMBBACK_CLASS, _sliderThumb, _thumb, true);
			_createElement(SLIDER_THUMBBOTTOM_CLASS, _sliderThumbCapBottom, _thumb);
			
			_css(_internalSelector(SLIDER_THUMBBACK_CLASS), {
				top: _sliderThumbCapTop.height,
				bottom: _sliderThumbCapBottom.height
			});
			
			_redraw();
			
			if (_pane) {
				_pane.addEventListener("mousewheel", _scrollHandler, false);
				_pane.addEventListener("DOMMouseScroll", _scrollHandler, false);
			}
		}
		
		function _internalSelector(className) {
			return '#' + _wrapper.id + (className ? " ." + className : "");
		}
		
		function _createElement(className, skinElement, parent, stretch) {
			var elem = DOCUMENT.createElement("div");
			if (className) {
				elem.className = className;
				if (skinElement) {
					_css(_internalSelector(className), { 
						'background-image': skinElement.src ? skinElement.src : UNDEFINED, 
						'background-repeat': stretch ? "repeat-y" : "no-repeat",
						height: stretch ? UNDEFINED : skinElement.height
					});
				}
			}
			if (parent) parent.appendChild(elem);
			return elem;
		}
		
		function _populateSkinElements() {
			_sliderCapTop = _getElement('sliderCapTop');
			_sliderCapBottom = _getElement('sliderCapBottom');
			_sliderRail = _getElement('sliderRail');
			_sliderRailCapTop = _getElement('sliderRailCapTop');
			_sliderRailCapBottom = _getElement('sliderRailCapBottom');
			_sliderThumb = _getElement('sliderThumb');
			_sliderThumbCapTop = _getElement('sliderThumbCapTop');
			_sliderThumbCapBottom = _getElement('sliderThumbCapBottom');
		}
		
		function _getElement(name) {
			var elem = _skin.getSkinElement("playlist", name);
			return elem ? elem : { width: 0, height: 0, src: UNDEFINED };
		}
		
		var _redraw = this.redraw = function() {
			clearTimeout(_redrawTimeout);
			_redrawTimeout = setTimeout(function() {
				if (_pane && _pane.clientHeight) {
					_setThumbPercent(_pane.parentNode.clientHeight / _pane.clientHeight);
				} else {
					_redrawTimeout = setTimeout(_redraw, 10);
				}
			}, 0);
		}
		

		function _scrollHandler(evt) {
			if (!_visible) return;
			evt = evt ? evt : WINDOW.event;
			var wheelData = evt.detail ? evt.detail * -1 : evt.wheelDelta / 40;
			_setThumbPosition(_thumbPercent - wheelData / 10);
			  
			// Cancel event so the page doesn't scroll
			if(evt.stopPropagation) evt.stopPropagation();
			if(evt.preventDefault) evt.preventDefault();
			evt.cancelBubble = true;
			evt.cancel = true;
			evt.returnValue = false;
			return false;
		};
	
		function _setThumbPercent(pct) {
			if (pct < 0) pct = 0;
			if (pct > 1) {
				_visible = false;
			} else {
				_visible = true;
				_css(_internalSelector(SLIDER_THUMB_CLASS), { height: Math.max(_rail.clientHeight * pct , _sliderThumbCapTop.height + _sliderThumbCapBottom.height) });
			}
			_css(_internalSelector(), { visibility: _visible ? "visible" : "hidden" });
			if (_pane) {
				_pane.style.width = _visible ? _pane.parentElement.clientWidth - _sliderRail.width + "px" : "";
			}
		}

		var _setThumbPosition = this.thumbPosition = function(pct) {
			if (isNaN(pct)) pct = 0;
			_thumbPercent = Math.max(0, Math.min(1, pct));
			_css(_internalSelector(SLIDER_THUMB_CLASS), {
				top: _topHeight + (_rail.clientHeight - _thumb.clientHeight) * _thumbPercent
			});
			if (pane) {
				pane.style.top = (_wrapper.clientHeight - pane.scrollHeight) * _thumbPercent + "px";
			}
		}


		function _startDrag(evt) {
			if (evt.button == 0) _dragging = true;
			DOCUMENT.onselectstart = function() { return false; }; 
			WINDOW.addEventListener('mousemove', _moveThumb, false);
			WINDOW.addEventListener('mouseup', _endDrag, false);
		}
		
		function _moveThumb(evt) {
			if (_dragging || evt.type == "click") {
				var railRect = utils.bounds(_rail),
					rangeTop = _thumb.clientHeight / 2,
					rangeBottom = railRect.height - rangeTop,
					y = evt.pageY - railRect.top,
					pct = (y - rangeTop) / (rangeBottom - rangeTop);
				_setThumbPosition(pct);
			}
		}
		
		function _scroll(dir) {
			return function(evt) {
				if (evt.button > 0) return;
				_setThumbPosition(_thumbPercent+(dir*.05));
				_dragTimeout = setTimeout(function() {
					_dragInterval = setInterval(function() {
						_setThumbPosition(_thumbPercent+(dir*.05));
					}, 50);
				}, 500);
			}
		}
		
		function _endDrag() {
			_dragging = false;
			WINDOW.removeEventListener('mousemove', _moveThumb);
			WINDOW.removeEventListener('mouseup', _endDrag);
			DOCUMENT.onselectstart = UNDEFINED; 
			clearTimeout(_dragTimeout);
			clearInterval(_dragInterval);
		}
		
		_setup();
		return this;
	};
	
	function _globalSelector() {
		var selector=[],i;
		for (i=0; i<arguments.length; i++) {
			selector.push(".jwplaylist ."+arguments[i]);
		}
		return selector.join(',');
	}
	
	/** Global slider styles **/

	_css(_globalSelector(SLIDER_CLASS), {
		position: JW_CSS_ABSOLUTE,
		height: JW_CSS_100PCT,
		visibility: "hidden",
		right: 0,
		top: 0,
		cursor: "pointer",
		'z-index': 1
	});
	
	_css(_globalSelector(SLIDER_CLASS) + ' *', {
		position: JW_CSS_ABSOLUTE,
	    width: JW_CSS_100PCT,
	    'background-position': "center",
	    'background-size': JW_CSS_100PCT + " " + JW_CSS_100PCT,
	});

	_css(_globalSelector(SLIDER_TOPCAP_CLASS, SLIDER_RAILTOP_CLASS, SLIDER_THUMBTOP_CLASS), { top: 0 });
	_css(_globalSelector(SLIDER_BOTTOMCAP_CLASS, SLIDER_RAILBOTTOM_CLASS, SLIDER_THUMBBOTTOM_CLASS), { bottom: 0 });

})(jwplayer.html5);
