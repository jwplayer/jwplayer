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
	JW_CSS_NONE = "none",
	JW_CSS_100PCT = "100%";
	
	html5.playlistcomponent = function(api, config) {
		var _api = api,
			_skin = _api.skin,
			_settings = _utils.extend({}, _defaults, _api.skin.getComponentSettings("playlist"), config),
			_wrapper,
			_width,
			_height,
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
		
		this.resize = function(width, height) {
			_width = width;
			_height = height;
		};
		
		this.show = function() {
			_show(_wrapper);
		}

		this.hide = function() {
			_hide(_wrapper);
		}


		function _setup() {
			_wrapper = DOCUMENT.createElement("div");
			_wrapper.id = _api.id + "_jwplayer_playlistcomponent";
			_wrapper.className = "jwplaylist";
			_populateSkinElements();
			if (_elements.item) {
				_settings.itemheight = _elements.item.height;
			}
			
			_setupStyles();
			
			_api.jwAddEventListener(jwplayer.events.JWPLAYER_PLAYLIST_LOADED, _rebuildPlaylist);
			_api.jwAddEventListener(jwplayer.events.JWPLAYER_PLAYLIST_ITEM, _itemHandler);
		}
		
		function _setupStyles() {
			var imgPos = 0, imgWidth = 0, imgHeight = 0, 
				itemheight = _settings.itemheight,
				fontsize = _settings.fontsize

			_utils.clearCss('#'+_wrapper.id);
				
			_css('#'+_wrapper.id+' .jwlist', {
		    	'background-color': _settings.backgroundcolor,
		    	'background-image': _elements.background ? "url("+_elements.background.src+")" : "",
		    	color: _settings.fontcolor,
		    	'font-family': _fonts[_settings.font] ? _fonts[_settings.font] : _fonts['_sans'],
		    	'font-size': (fontsize ? fontsize : 11) + "px",
		    	'font-style': _settings.fontstyle,
		    	'font-weight': _settings.fontweight
			});
			
        	if (_elements.itemImage) {
        		imgPos = (itemheight - _elements.itemImage.height) / 2;
        		imgWidth = _elements.itemImage.width;
        		imgHeight = _elements.itemImage.height;
        	} else {
        		imgWidth = itemheight * 4 / 3;
        		imgHeight = itemheight
        	}
			
        	_css('#'+_wrapper.id+' .jwplaylistimg', {
			    height: imgHeight,
			    width: imgWidth,
				margin: imgPos
        	});
			
			_css('#'+_wrapper.id+' .jwlist li', {
				'background-image': _elements.item ? "url("+_elements.item.src+")" : "",
				height: itemheight,
				'background-size': JW_CSS_100PCT + " " + itemheight + "px"
			});

			var activeStyle = { overflow: 'hidden' };
			if (_settings.activecolor !== "") activeStyle.color = _settings.activecolor;
			if (_elements.itemActive) activeStyle['background-image'] = "url("+_elements.itemActive.src+")";
			_css('#'+_wrapper.id+' .jwlist li.active', activeStyle);

			var overStyle = { overflow: 'hidden' };
			if (_settings.overcolor !== "") overStyle.color = _settings.overcolor;
			if (_elements.itemOver) overStyle['background-image'] = "url("+_elements.itemOver.src+")";
			_css('#'+_wrapper.id+' .jwlist li:hover', overStyle);


			_css('#'+_wrapper.id+" .jwtextwrapper", {
				padding: "5px 5px 0 " + (imgPos ? 0 : "5px"),
				height: itemheight - 5
			});
			
			_css('#'+_wrapper.id+" .jwtitle", {
	    		height: fontsize ? fontsize + 10 : 20,
	    		'line-height': fontsize ? fontsize + 10 : 20,
	        	overflow: 'hidden',
		    	'font-size': fontsize ? fontsize : 13,
	        	'font-weight': _settings.fontweight ? _settings.fontweight : "bold"
	    	});
			
			_css('#'+_wrapper.id+" .jwdescription", {
	    	    display: 'block',
	        	'line-height': fontsize ? fontsize + 4 : 16,
	        	overflow: 'hidden',
	        	height: itemheight,
	        	position: "relative"
	    	});

		}

		function _createList() {
			var ul = DOCUMENT.createElement("ul");
			ul.className = 'jwlist';
			ul.id = _wrapper.id + "_ul" + Math.round(Math.random()*10000000);
			return ul;
		}


		function _createItem(index) {
			var item = _playlist[index],
				li = DOCUMENT.createElement("li");
			
			li.className = "jwitem";
			li.id = _ul.id + '_item_' + index;
			
			_css(li,{
			    height: _settings.itemheight,
		    	display: 'block',
		    	cursor: 'pointer',
			    backgroundImage: _elements.item ? "url("+_elements.item.src+")" : "",
			    backgroundSize: "100% " + _settings.itemheight + "px"
		    });

			var imageWrapper = DOCUMENT.createElement("div")
			
			imageWrapper.className = 'jwplaylistimg jwfill';
        	
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
	        	
				li.appendChild(imageWrapper);
	        }
			
			var textWrapper = DOCUMENT.createElement("div");
	        textWrapper.className = 'jwtextwrapper';
        	var title = DOCUMENT.createElement("span");
        	title.className = 'jwtitle';
        	title.innerHTML = item ? item.title : "";
        	textWrapper.appendChild(title);

	        if (item.description) {
	        	var desc = DOCUMENT.createElement("span");
	        	desc.className = 'jwdescription';
	        	desc.innerHTML = item.description;
	        	textWrapper.appendChild(desc);
	        }
	        li.appendChild(textWrapper);
			return li;
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
				_ul.appendChild(li);
				items.push(li);
			}
			
			_lastCurrent = _api.jwGetPlaylistIndex();
			
			_wrapper.appendChild(_ul);

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
		overflow: 'hidden',
		position: 'absolute',
	    width: JW_CSS_100PCT,
		height: JW_CSS_100PCT
	});

	_css(PL_CLASS + ' .jwplaylistimg', {
		position: "relative",
	    width: JW_CSS_100PCT,
	    'float': 'left',
	    margin: '0 5px 0 0',
		background: 'black',
		overflow: 'hidden'
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
		overflow: "hidden"
	});


})(jwplayer.html5);
