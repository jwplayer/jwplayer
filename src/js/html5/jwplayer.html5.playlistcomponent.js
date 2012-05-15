/**
 * jwplayer Playlist component for the JW Player.
 *
 * @author pablo
 * @version 6.0
 */
(function(html5) {
	var _defaults = {
		size: 180,
		//position: html5.view.positions.NONE,
		itemheight: 60,
		thumbs: true,
		
		fontcolor: "#000000",
		overcolor: "",
		activecolor: "",
		backgroundcolor: "#f8f8f8",
		font: "_sans",
		fontsize: "",
		fontstyle: "",
		fontweight: ""
	},

	_fonts = {
		'_sans': "Arial, Helvetica, sans-serif",
		'_serif': "Times, Times New Roman, serif",
		'_typewriter': "Courier New, Courier, monospace"
	},
	
	_utils = jwplayer.utils, 
	_css = _utils.css,
	_events = jwplayer.events,
	
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
			_settings = _utils.extend({}, _defaults, _api.skin.getComponentSettings("playlist"), config),
			_wrapper,
			_playlist,
			_items,
			_ul,
			_lastCurrent = -1,
			_elements = {
				'background': undefined,
				'item': undefined,
				'itemOver': undefined,
				'itemImage': undefined,
				'itemActive': undefined
			};

		this.getDisplayElement = function() {
			return _wrapper;
		};
		
		this.redraw = function() {
			// not needed
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
			_populateSkinElements();
			if (_elements.item) {
				_settings.itemheight = _elements.item.height;
			}
			
			_setupStyles();
			
			_api.jwAddEventListener(jwplayer.events.JWPLAYER_PLAYLIST_LOADED, _rebuildPlaylist);
			_api.jwAddEventListener(jwplayer.events.JWPLAYER_PLAYLIST_ITEM, _itemHandler);
		}
		
		function _internalSelector(className) {
			return '#' + _wrapper.id + (className ? ' .' + className : "");
		}
		
		function _setupStyles() {
			var imgPos = 0, imgWidth = 0, imgHeight = 0, 
				itemheight = _settings.itemheight,
				fontsize = _settings.fontsize

			_utils.clearCss(_internalSelector());

			
			_css(_internalSelector("jwlist"), {
				'background-image': _elements.background ? " url("+_elements.background.src+")" : "",
				'background-color':	_settings.backgroundcolor, 
		    	color: _settings.fontcolor,
		    	font: _settings.fontweight + " " + _settings.fontstyle + " " + (fontsize ? fontsize : 11) + "px " + (_fonts[_settings.font] ? _fonts[_settings.font] : _fonts['_sans'])  
			});
			
        	if (_elements.itemImage) {
        		imgPos = (itemheight - _elements.itemImage.height) / 2;
        		imgWidth = _elements.itemImage.width;
        		imgHeight = _elements.itemImage.height;
        	} else {
        		imgWidth = itemheight * 4 / 3;
        		imgHeight = itemheight
        	}
			
        	_css(_internalSelector("jwplaylistimg"), {
			    height: imgHeight,
			    width: imgWidth,
				margin: imgPos
        	});
			
			_css(_internalSelector("jwlist li"), {
				'background-image': _elements.item ? "url("+_elements.item.src+")" : "",
				height: itemheight,
				'background-size': JW_CSS_100PCT + " " + itemheight + "px",
		    	cursor: 'pointer'
			});

			var activeStyle = { overflow: 'hidden' };
			if (_settings.activecolor !== "") activeStyle.color = _settings.activecolor;
			if (_elements.itemActive) activeStyle['background-image'] = "url("+_elements.itemActive.src+")";
			_css(_internalSelector("jwlist li.active"), activeStyle);

			var overStyle = { overflow: 'hidden' };
			if (_settings.overcolor !== "") overStyle.color = _settings.overcolor;
			if (_elements.itemOver) overStyle['background-image'] = "url("+_elements.itemOver.src+")";
			_css(_internalSelector("jwlist li:hover"), overStyle);


			_css(_internalSelector("jwtextwrapper"), {
				padding: "5px 5px 0 " + (imgPos ? 0 : "5px"),
				height: itemheight - 5,
				position: JW_CSS_RELATIVE
			});
			
			_css(_internalSelector("jwtitle"), {
	    		height: fontsize ? fontsize + 10 : 20,
	    		'line-height': fontsize ? fontsize + 10 : 20,
	        	overflow: 'hidden',
	        	display: "inline-block",
	        	width: JW_CSS_100PCT,
		    	'font-size': fontsize ? fontsize : 13,
	        	'font-weight': _settings.fontweight ? _settings.fontweight : "bold"
	    	});
			
			_css(_internalSelector("jwdescription"), {
	    	    display: 'block',
	        	'line-height': fontsize ? fontsize + 4 : 16,
	        	overflow: 'hidden',
	        	height: itemheight,
	        	position: JW_CSS_RELATIVE
	    	});

			_css(_internalSelector("jwduration"), {
				position: "absolute",
				right: 5
			});
			
		}

		function _createList() {
			var ul = _createElement("ul", "jwlist");
			ul.id = _wrapper.id + "_ul" + Math.round(Math.random()*10000000);
			return ul;
		}


		function _createItem(index) {
			var item = _playlist[index],
				li = _createElement("li", "jwitem");
			
			li.id = _ul.id + '_item_' + index;
			
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
        	title.innerHTML = item ? item.title : "";
        	_appendChild(textWrapper, title);

	        if (item.description) {
	        	var desc = _createElement("span", "jwdescription");
	        	desc.innerHTML = item.description;
	        	_appendChild(textWrapper, desc);
	        }
	        
	        if (item.duration > 0) {
	        	var dur = _createElement("span", "jwduration");
	        	dur.innerHTML = _utils.timeFormat(item.duration);
	        	_appendChild(title, dur);
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
			_wrapper.innerHTML = "";
			
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
			
			_appendChild(_wrapper, _ul);

			if (_utils.isIOS() && window.iScroll) {
				_ul.style.height = _settings.itemheight * _playlist.length + "px";
				var myscroll = new iScroll(_wrapper.id);
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
				_api.jwPlaylistItem(index);
				_api.jwPlay(true);
			}
		}
		
		function _scrollToItem() {
			_ul.scrollTop = _api.jwGetPlaylistIndex() * _settings.itemheight;
		}

		function _showThumbs() {
			return _settings.thumbs.toString().toLowerCase() == "true";	
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
			for (var i in _elements) {
				_elements[i] = _getElement(i);
			}
		}
		
		function _getElement(name) {
			return _skin.getSkinElement("playlist", name);
		}
		
		_setup();
		return this;
	};
	
	/** Global playlist styles **/

	_css(PL_CLASS, {
		overflow: JW_CSS_HIDDEN,
		position: JW_CSS_ABSOLUTE,
	    width: JW_CSS_100PCT,
		height: JW_CSS_100PCT
	});

	_css(PL_CLASS + ' .jwplaylistimg', {
		position: JW_CSS_RELATIVE,
	    width: JW_CSS_100PCT,
	    'float': 'left',
	    margin: '0 5px 0 0',
		background: "#000",
		overflow: JW_CSS_HIDDEN
	});

	_css(PL_CLASS+' .jwlist', {
	    width: JW_CSS_100PCT,
		height: JW_CSS_100PCT,
    	'list-style': 'none',
    	margin: 0,
    	padding: 0,
    	'overflow-y': 'auto'
	});

	_css(PL_CLASS+' .jwlist li', {
	    width: JW_CSS_100PCT
	});

	_css(PL_CLASS+' .jwtextwrapper', {
		overflow: JW_CSS_HIDDEN
	});


})(jwplayer.html5);
