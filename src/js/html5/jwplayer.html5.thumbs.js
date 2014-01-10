(function(jwplayer) {

	var html5 = jwplayer.html5,
		utils = jwplayer.utils,
		events = jwplayer.events,
		_css = utils.css;
		

	/** Displays thumbnails over the controlbar **/
	html5.thumbs = function(id) {
		var _display,
			_cues,
			_vttPath,
			_id = id,
			_src,
			_eventDispatcher = new events.eventdispatcher();

		utils.extend(this, _eventDispatcher);

		_display = document.createElement("div");
		_display.id = _id;

		function _loadVTT(vtt) {
			_css.style(_display, {
				display: "none"
			});
			
			if (vtt) {
				_vttPath = vtt.split("?")[0].split("/").slice(0, -1).join("/");
				utils.ajax(vtt,_vttLoaded,_vttFailed)
			}
		}
		
		function _vttLoaded(data) {
		    try {
		      data = new jwplayer.parsers.srt().parse(data.responseText,true);
		    } catch (e) {
		        _vttFailed(e.message);
		        return;
		    }
			if (utils.typeOf(data) !== "array") {
				return _vttFailed("Invalid data");
			}
			_cues = data;

			_css.style(_display, {
				display: "block"
			});
		}
		
		function _vttFailed(error) {
			utils.log("Thumbnails could not be loaded: " + error);        
		}
		
		function _loadImage(url) {
			// only load image if it's different from the last one
			if (url !== _src) {
				if (url.indexOf("://") < 0) url = _vttPath ? _vttPath + "/" + url : url;
				var hashIndex = url.indexOf("#xywh");
				if (hashIndex > 0) {
					try {
						var regEx = /(.+)\#xywh=(\d+),(\d+),(\d+),(\d+)/,
							thumbParams = regEx.exec(url),
							x = thumbParams[2] * -1,
							y = thumbParams[3] * -1,
							width = thumbParams[4],
							height = thumbParams[5],
							bgImage = thumbParams[1];
						
						_css.style(_display, {
							'background-image': bgImage,
							'background-position': x + "px " + y + "px",
							width: width,
							height: height
						});
					} catch(e) {
						_vttFailed("Could not parse thumbnail");
					}
					
				} else {
					var image = new Image();
					image.addEventListener('load', _imageLoaded, false);
				}
				_src = url;
			}
		} 
		
		function _imageLoaded(evt) {
			var image = evt.target;
			_css.style(_display, {
				'background-image': image.src,
				'background-position': "0 0",
				width: image.width,
				height: image.height
			});
		}
		
		this.load = function(thumbsVTT) {
			_loadVTT(thumbsVTT);
		};
		
		this.element = function() {
			return _display;
		};
		
		// Update display
		this.updateTimeline = function(seconds) {
			var i = 0;
			if (!_cues) return; 
			while(i < _cues.length && seconds > _cues[i].end) {
				i++;
			}
			if (i == _cues.length) i--;
			if (_cues[i].text) {
				_loadImage(_cues[i].text);
			}
		};
	};


})(jwplayer);
