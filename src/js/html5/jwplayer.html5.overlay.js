/**
 * JW Player HTML5 overlay component
 * 
 * @author pablo
 * @version 6.0
 */
(function(jwplayer) {
	var html5 = jwplayer.html5,
		utils = jwplayer.utils,
		_css = utils.css,
		_setTransition = utils.transitionStyle,

		/** Some CSS constants we should use for minimization **/
		JW_CSS_RELATIVE = "relative",
		JW_CSS_ABSOLUTE = "absolute",
		//JW_CSS_NONE = "none",
		//JW_CSS_BLOCK = "block",
		//JW_CSS_INLINE = "inline",
		//JW_CSS_INLINE_BLOCK = "inline-block",
		JW_CSS_HIDDEN = "hidden",
		//JW_CSS_LEFT = "left",
		//JW_CSS_RIGHT = "right",
		JW_CSS_100PCT = "100%",
		JW_CSS_SMOOTH_EASE = "opacity .25s, visibility .25s, left .01s linear",
		
		OVERLAY_CLASS = '.jwoverlay',
		CONTENTS_CLASS = 'jwcontents',
		
		TOP = "top",
		BOTTOM = "bottom",
		RIGHT = "right",
		LEFT = "left",
		WHITE = "#ffffff",
		
		UNDEFINED,
		DOCUMENT = document,
		
		_defaults = {
			fontcase: UNDEFINED,
			fontcolor: WHITE,
			fontsize: 12,
			fontweight: UNDEFINED,
			activecolor: WHITE,
			overcolor: WHITE
		};
	
	/** HTML5 Overlay class **/
	html5.overlay = function(id, skin, inverted) {
		var _this = this,
			_id = id,
			_skin = skin,
			_inverted = inverted,
			_container,
			_contents,
			_arrow,
			_arrowElement,
			_settings = utils.extend({}, _defaults, _skin.getComponentSettings('tooltip')),
			_borderSizes = {};
		
		function _init() {
			_container = _createElement(OVERLAY_CLASS.replace(".",""));
			_container.id = _id;

			var arrow = _createSkinElement("arrow", "jwarrow");
			_arrowElement = arrow[0];
			_arrow = arrow[1];
			
			_css.style(_arrowElement, {
				position: JW_CSS_ABSOLUTE,
				//bottom: _inverted ? UNDEFINED : -1 * _arrow.height,
				bottom: _inverted ? UNDEFINED : 0,
				top: _inverted ? 0 : UNDEFINED,
				width: _arrow.width,
				height: _arrow.height,
				left: "50%"
			});

			_createBorderElement(TOP, LEFT);
			_createBorderElement(BOTTOM, LEFT);
			_createBorderElement(TOP, RIGHT);
			_createBorderElement(BOTTOM, RIGHT);
			_createBorderElement(LEFT);
			_createBorderElement(RIGHT);
			_createBorderElement(TOP);
			_createBorderElement(BOTTOM);
			
			var back = _createSkinElement("background", "jwback");
			_css.style(back[0], {
				left: _borderSizes.left,
				right: _borderSizes.right,
				top: _borderSizes.top,
				bottom: _borderSizes.bottom
			});
			
			_contents = _createElement(CONTENTS_CLASS, _container);
			_css(_internalSelector(CONTENTS_CLASS) + " *", {
				color: _settings.fontcolor,
				font: _settings.fontweight + " " + (_settings.fontsize) + "px Arial,Helvetica,sans-serif",
				'text-transform': (_settings.fontcase == "upper") ? "uppercase" : UNDEFINED
			});

			
			if (_inverted) {
				utils.transform(_internalSelector("jwarrow"), "rotate(180deg)");
			}

			_css.style(_container, {
				padding: (_borderSizes.top+1) + "px " + _borderSizes.right + "px " + (_borderSizes.bottom+1) + "px " + _borderSizes.left + "px"  
			});
			
			_this.showing = false;
		}
		
		function _internalSelector(name) {
			return '#' + _id + (name ? " ." + name : "");
		}

		function _createElement(className, parent) {
			var elem = DOCUMENT.createElement("div");
			if (className) elem.className = className;
			if (parent) parent.appendChild(elem);
			return elem;
		}


		function _createSkinElement(name, className) {
			var skinElem = _getSkinElement(name),
				elem = _createElement(className, _container);
			
			_css.style(elem, _formatBackground(skinElem));
			//_css(_internalSelector(className.replace(" ", ".")), _formatBackground(skinElem));
			
			return [elem, skinElem];
			
		}
		
		function _formatBackground(elem) {
			return {
				background: "url("+elem.src+") center",
				'background-size': elem.width + "px " + elem.height + "px"
			};
		}
		
		function _createBorderElement(dim1, dim2) {
			if (!dim2) dim2 = "";
			var created = _createSkinElement('cap' + dim1 + dim2, "jwborder jw" + dim1 + (dim2 ? dim2 : "")), 
				elem = created[0],
				skinElem = created[1],
				elemStyle = utils.extend(_formatBackground(skinElem), {
					width: (dim1 == LEFT || dim2 == LEFT || dim1 == RIGHT || dim2 == RIGHT) ? skinElem.width: UNDEFINED,
					height: (dim1 == TOP || dim2 == TOP || dim1 == BOTTOM || dim2 == BOTTOM) ? skinElem.height: UNDEFINED
				});
			
			
			elemStyle[dim1] = ((dim1 == BOTTOM && !_inverted) || (dim1 == TOP && _inverted)) ? _arrow.height : 0;
			if (dim2) elemStyle[dim2] = 0;
			
			_css.style(elem, elemStyle);
			//_css(_internalSelector(elem.className.replace(/ /g, ".")), elemStyle);
			
			var dim1style = {}, 
				dim2style = {}, 
				dims = { 
					left: skinElem.width, 
					right: skinElem.width, 
					top: (_inverted ? _arrow.height : 0) + skinElem.height, 
					bottom: (_inverted ? 0 : _arrow.height) + skinElem.height
				};
			if (dim2) {
				dim1style[dim2] = dims[dim2];
				dim1style[dim1] = 0;
				dim2style[dim1] = dims[dim1];
				dim2style[dim2] = 0;
				_css(_internalSelector("jw"+dim1), dim1style);
				_css(_internalSelector("jw"+dim2), dim2style);
				_borderSizes[dim1] = dims[dim1];
				_borderSizes[dim2] = dims[dim2];
			}
		}

		_this.element = function() {
			return _container;
		};
		
		_this.setContents = function(contents) {
			utils.empty(_contents);
			_contents.appendChild(contents);
		};

		_this.positionX = function(x) {
			_css.style(_container, {
				left: Math.round(x)
			});
		};
		
		_this.constrainX = function(containerBounds, forceRedraw) {
			if (containerBounds.width !== 0) {
				// reset and check bounds
				_this.offsetX(0);
				if (forceRedraw) {
					_css.unblock();
				}
				var bounds = utils.bounds(_container);
				if (bounds.width !== 0) {
					if (bounds.right > containerBounds.right) {
						_this.offsetX(containerBounds.right - bounds.right);
					} else if (bounds.left < containerBounds.left) {
						_this.offsetX(containerBounds.left - bounds.left);
					}
				}
			}
		};

		_this.offsetX = function(offset) {
			offset = Math.round(offset);
			var width = _container.clientWidth;
			if (width !== 0) {
				_css.style(_container, {
					'margin-left': Math.round(-width/2) + offset
				});
				_css.style(_arrowElement, {
					'margin-left': Math.round(-_arrow.width/2) - offset
				});
			}
		};
		
		_this.borderWidth = function() {
			return _borderSizes.left;
		};

		function _getSkinElement(name) {
			var elem = _skin.getSkinElement('tooltip', name); 
			if (elem) {
				return elem;
			} else {
				return {
					width: 0,
					height: 0,
					src: "",
					image: UNDEFINED,
					ready: false
				};
			}
		}
		
		_this.show = function() {
			_this.showing = true;
			_css.style(_container, {
				opacity: 1,
				visibility: "visible"
			});
		};
		
		_this.hide = function() {
			_this.showing = false;
			_css.style(_container, {
				opacity: 0,
				visibility: JW_CSS_HIDDEN
			});
		};
		
		// Call constructor
		_init();

	};

	/*************************************************************
	 * Player stylesheets - done once on script initialization;  *
	 * These CSS rules are used for all JW Player instances      *
	 *************************************************************/

	_css(OVERLAY_CLASS, {
		position: JW_CSS_ABSOLUTE,
		visibility: JW_CSS_HIDDEN,
		opacity: 0
	});

	_css(OVERLAY_CLASS + " .jwcontents", {
		position: JW_CSS_RELATIVE,
		'z-index': 1
	});

	_css(OVERLAY_CLASS + " .jwborder", {
		position: JW_CSS_ABSOLUTE,
		'background-size': JW_CSS_100PCT + " " + JW_CSS_100PCT
	}, true);

	_css(OVERLAY_CLASS + " .jwback", {
		position: JW_CSS_ABSOLUTE,
		'background-size': JW_CSS_100PCT + " " + JW_CSS_100PCT
	});

	_setTransition(OVERLAY_CLASS, JW_CSS_SMOOTH_EASE);
	
})(jwplayer);
