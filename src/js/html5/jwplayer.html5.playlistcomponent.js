/**
 * jwplayer Playlist component for the JW Player.
 *
 * @author pablo
 * @version 6.0
 */
(function(html5) {
	var WHITE = "#FFFFFF",
		CCC = "#CCCCCC",
		THREES = "#333333",
		NINES = "#999999",
		NORMAL = "normal",
		_defaults = {
			size: 180,
			//position: html5.view.positions.NONE,
			//thumbs: true,
			// Colors
			backgroundcolor: THREES,
			fontcolor: NINES,
			overcolor: CCC,
			activecolor: CCC,
			titlecolor: CCC,
			titleovercolor: WHITE,
			titleactivecolor: WHITE,
			
			fontweight: NORMAL,
			titleweight: NORMAL,
			fontsize: 11,
			titlesize: 13
		},

		events = jwplayer.events,
		utils = jwplayer.utils, 
		_css = utils.css,
		
		PL_CLASS = '.jwplaylist',
		DOCUMENT = document,
		
		/** Some CSS constants we should use for minimization **/
		JW_CSS_ABSOLUTE = "absolute",
		JW_CSS_RELATIVE = "relative",
		JW_CSS_HIDDEN = "hidden",
		JW_CSS_100PCT = "100%";
	
	html5.playlistcomponent = function(api, config) {
		var _api = api,
			_skin = _api.skin,
			_settings = utils.extend({}, _defaults, _api.skin.getComponentSettings("playlist"), config),
			_wrapper,
			_container,
			_playlist,
			_items,
			_ul,
			_lastCurrent = -1,
			_clickedIndex,
			_slider,
			_itemheight = 60,
			_elements = {
				'background': undefined,
				'divider': undefined,
				'item': undefined,
				'itemOver': undefined,
				'itemImage': undefined,
				'itemActive': undefined
			};

		this.element = function() {
			return _wrapper;
		};
		
		this.redraw = function() {
			if (_slider) _slider.redraw();
		};
		
		this.show = function() {
			_show(_wrapper);
		}

		this.hide = function() {
			_hide(_wrapper);
		}


		function _setup() {
			_wrapper = _createElement("div", "jwplaylist"); 
			_wrapper.id = _api.id + "_jwplayer_playlistcomponent";
			
			_container = _createElement("div", "jwlistcontainer");
			_appendChild(_wrapper, _container);
			
			_populateSkinElements();
			if (_elements.item) {
				_itemheight = _elements.item.height;
			}
			
			_setupStyles();
			
			_api.jwAddEventListener(events.JWPLAYER_PLAYLIST_LOADED, _rebuildPlaylist);
			_api.jwAddEventListener(events.JWPLAYER_PLAYLIST_ITEM, _itemHandler);
		}
		
		function _internalSelector(className) {
			return '#' + _wrapper.id + (className ? ' .' + className : "");
		}
		
		function _setupStyles() {
			var imgPos = 0, imgWidth = 0, imgHeight = 0; 

			utils.clearCss(_internalSelector());

			_css(_internalSelector(), {
				'background-color':	_settings.backgroundcolor 
			});
			
			_css(_internalSelector("jwlist"), {
				'background-image': _elements.background ? " url("+_elements.background.src+")" : "",
			});
			
			_css(_internalSelector("jwlist" + " *"), {
				color: _settings.fontcolor,
				font: _settings.fontweight + " " + _settings.fontsize + "px Arial, Helvetica, sans-serif"
			});

			
        	if (_elements.itemImage) {
        		imgPos = (_itemheight - _elements.itemImage.height) / 2 + "px ";
        		imgWidth = _elements.itemImage.width;
        		imgHeight = _elements.itemImage.height;
        	} else {
        		imgWidth = _itemheight * 4 / 3;
        		imgHeight = _itemheight
        	}
			
        	if (_elements.divider) {
        		_css(_internalSelector("jwplaylistdivider"), {
        			'background-image': "url("+_elements.divider.src + ")",
        			'background-size': JW_CSS_100PCT + " " + _elements.divider.height + "px",
        			width: JW_CSS_100PCT,
        			height: _elements.divider.height
        		});
        	}
        	
        	_css(_internalSelector("jwplaylistimg"), {
			    height: imgHeight,
			    width: imgWidth,
				margin: imgPos ? (imgPos + imgPos + imgPos + imgPos) : "0 5px 0 0"
        	});
			
			_css(_internalSelector("jwlist li"), {
				'background-image': _elements.item ? "url("+_elements.item.src+")" : "",
				height: _itemheight,
				'background-size': JW_CSS_100PCT + " " + _itemheight + "px",
		    	cursor: 'pointer'
			});

			var activeStyle = { overflow: 'hidden' };
			if (_settings.activecolor !== "") activeStyle.color = _settings.activecolor;
			if (_elements.itemActive) activeStyle['background-image'] = "url("+_elements.itemActive.src+")";
			_css(_internalSelector("jwlist li.active"), activeStyle);
			_css(_internalSelector("jwlist li.active .jwtitle"), {
				color: _settings.titleactivecolor
			});

			var overStyle = { overflow: 'hidden' };
			if (_settings.overcolor !== "") overStyle.color = _settings.overcolor;
			if (_elements.itemOver) overStyle['background-image'] = "url("+_elements.itemOver.src+")";
			_css(_internalSelector("jwlist li:hover"), overStyle);
			_css(_internalSelector("jwlist li:hover .jwtitle"), {
				color: _settings.titleovercolor
			});


			_css(_internalSelector("jwtextwrapper"), {
				//padding: "0 5px 0 " + (imgPos ? 0 : "5px"),
				height: _itemheight - 5,
				position: JW_CSS_RELATIVE
			});
			
			_css(_internalSelector("jwtitle"), {
	    		height: 15,
	        	overflow: 'hidden',
	        	display: "inline-block",
	        	width: JW_CSS_100PCT,
	        	color: _settings.titlecolor,
	        	'margin-top': imgPos ? imgPos : 7,
	        	'line-height': 13,
		    	'font-size': _settings.titlesize,
	        	'font-weight': _settings.titleweight
	    	});
			
			
			_css(_internalSelector("jwdescription"), {
	    	    display: 'block',
	    	    'font-size': _settings.fontsize,
	    	    'line-height': 19,
	    	    'margin-top': 5,
	        	overflow: 'hidden',
	        	height: _itemheight,
	        	position: JW_CSS_RELATIVE
	    	});

		}

		function _createList() {
			var ul = _createElement("ul", "jwlist");
			ul.id = _wrapper.id + "_ul" + Math.round(Math.random()*10000000);
			return ul;
		}


		function _createItem(index) {
			var item = _playlist[index],
				li = _createElement("li", "jwitem"),
				div;
			
			li.id = _ul.id + '_item_' + index;

	        if (index > 0) {
	        	div = _createElement("div", "jwplaylistdivider");
	        	_appendChild(li, div);
	        }
		        
			var imageWrapper = _createElement("div", "jwplaylistimg jwfill");
        	
			if (_showThumbs() && (item.image || item['playlist.image'] || _elements.itemImage) ) {
				var imageSrc; 
				if (item['playlist.image']) {
					imageSrc = item['playlist.image'];	
				} else if (item.image) {
					imageSrc = item.image;
				} else if (_elements.itemImage) {
					imageSrc = _elements.itemImage.src;
				}
	        	
	        	_css('#'+li.id+' .jwplaylistimg', {
					'background-image': imageSrc ? 'url('+imageSrc+')': null
	        	});
	        	
				_appendChild(li, imageWrapper);
	        }
			
			var textWrapper = _createElement("div", "jwtextwrapper");
        	var title = _createElement("span", "jwtitle");
        	title.innerHTML = (item && item.title) ? item.title : "";
        	_appendChild(textWrapper, title);

	        if (item.description) {
	        	var desc = _createElement("span", "jwdescription");
	        	desc.innerHTML = item.description;
	        	_appendChild(textWrapper, desc);
	        }
	        
	        _appendChild(li, textWrapper);
			return li;
		}
		
		function _createElement(type, className) {
			var elem = DOCUMENT.createElement(type);
			if (className) elem.className = className;
			return elem;
		}
		
		function _appendChild(parent, child) {
			parent.appendChild(child);
		}
			
		function _rebuildPlaylist(evt) {
			_container.innerHTML = "";
			
			_playlist = _getPlaylist();
			if (!_playlist) {
				return;
			}
			items = [];
			_ul = _createList();
			
			for (var i=0; i<_playlist.length; i++) {
				var li = _createItem(i);
				li.onclick = _clickHandler(i);
				_appendChild(_ul, li);
				items.push(li);
			}
			
			_lastCurrent = _api.jwGetPlaylistIndex();
			
			if (utils.isIOS() && window.iScroll) {
				_wrapper.innerHTML = "";
				_appendChild(_wrapper, _ul);
				_ul.style.height = _itemheight * _playlist.length + "px";
				var myscroll = new iScroll(_wrapper.id);
			} else {
				_appendChild(_container, _ul);
				_slider = new html5.playlistslider(_wrapper.id + "_slider", _api.skin, _wrapper, _ul);
			}
			
		}
		
		function _getPlaylist() {
			var list = _api.jwGetPlaylist();
			var strippedList = [];
			for (var i=0; i<list.length; i++) {
				if (!list[i]['ova.hidden']) {
					strippedList.push(list[i]);
				}
			}
			return strippedList;
		}
		
		function _clickHandler(index) {
			return function() {
				_clickedIndex = index;
				_api.jwPlaylistItem(index);
				_api.jwPlay(true);
			}
		}
		
		function _scrollToItem() {
			var idx = _api.jwGetPlaylistIndex();
			// No need to scroll if the user clicked the current item
			if (idx == _clickedIndex) return;
			_clickedIndex = -1;
				
			if (utils.isIOS() && window.iScroll) {
				_ul.scrollTop = idx * _itemheight;
			} else if (_slider && _slider.visible()) {
				_slider.thumbPosition(idx / (_api.jwGetPlaylist().length-1)) ;
			}
		}

		function _showThumbs() {
			return true;//_settings.thumbs.toString().toLowerCase() == "true";	
		}

		function _itemHandler(evt) {
			if (_lastCurrent >= 0) {
				DOCUMENT.getElementById(_ul.id + '_item_' + _lastCurrent).className = "jwitem";
				_lastCurrent = evt.index;
			}
			DOCUMENT.getElementById(_ul.id + '_item_' + evt.index).className = "jwitem active";
			_scrollToItem();
		}

		
		function _populateSkinElements() {
			for (var element in _elements) {
				_elements[element] = _skin.getSkinElement("playlist", element);
			}
		}
		
		_setup();
		return this;
	};
	
	/** Global playlist styles **/

	_css(PL_CLASS, {
		position: JW_CSS_ABSOLUTE,
	    width: JW_CSS_100PCT,
		height: JW_CSS_100PCT
	});
	
	utils.dragStyle(PL_CLASS, 'none');

	_css(PL_CLASS + ' .jwplaylistimg', {
		position: JW_CSS_RELATIVE,
	    width: JW_CSS_100PCT,
	    'float': 'left',
	    margin: '0 5px 0 0',
		background: "#000",
		overflow: JW_CSS_HIDDEN
	});

	_css(PL_CLASS+' .jwlist', {
		position: JW_CSS_ABSOLUTE,
		width: JW_CSS_100PCT,
    	'list-style': 'none',
    	margin: 0,
    	padding: 0
	});
	
	_css(PL_CLASS+' .jwlistcontainer', {
		position: JW_CSS_ABSOLUTE,
		overflow: JW_CSS_HIDDEN,
		width: JW_CSS_100PCT,
		height: JW_CSS_100PCT
	});

	_css(PL_CLASS+' .jwlist li', {
	    width: JW_CSS_100PCT
	});

	_css(PL_CLASS+' .jwtextwrapper', {
		overflow: JW_CSS_HIDDEN
	});

	_css(PL_CLASS+' .jwplaylistdivider', {
		position: JW_CSS_ABSOLUTE
	});

})(jwplayer.html5);
