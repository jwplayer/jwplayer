(function(html5) {

    var utils = jwplayer.utils,
        events = jwplayer.events,
        _css = utils.css;
        

    /** Displays thumbnails over the controlbar **/
    html5.thumbs = function(id) {
        var _display,
        	_image,
        	_imageURL,
        	_cues,
        	_vttPath,
        	_id = id,

            /** Event dispatcher for thumbnail events. **/
            _eventDispatcher = new events.eventdispatcher();

        utils.extend(this, _eventDispatcher);

        function _init() {
            _display = document.createElement("div");
            _display.id = _id;
        }

        function _loadVTT(vtt) {
        	_css(_internalSelector(), {
        		display: "none"
        	});
        	
        	if (vtt) {
            	_vttPath = vtt.split("?")[0].split("/").slice(0, -1).join("/");
            	new html5.parsers.srt(_vttLoaded, _vttFailed, true).load(vtt);
        	}
        }
        
        function _vttLoaded(data) {
        	if (!utils.typeOf(data) == "array") {
        		return _vttFailed("Invalid data");
        	}
        	_cues = data;

        	_css(_internalSelector(), {
        		display: "block"
        	});
        }
        
        function _vttFailed(error) {
        	utils.log("Thumbnails could not be loaded: " + error);        
        }
        
		function _internalSelector() {
			return '#' + _id;
		}
        
        function _loadImage(url) {
        	if (url.indexOf("://") < 0) url = _vttPath ? _vttPath + "/" + url : url;
        	var hashIndex = url.indexOf("#xywh");
        	if (hashIndex > 0) {
        		try {
            		var regEx = /(.+)\#xywh=(\d+),(\d+),(\d+),(\d+)/,
	        			thumbParams = regEx.exec(url),
	        			image = thumbParams[1],
	        			x = thumbParams[2] * -1,
	        			y = thumbParams[3] * -1,
	        			width = thumbParams[4],
	        			height = thumbParams[5];
            		
            		_css(_internalSelector(), {
            			'background-image': image,
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
        		image.src = url;
        	}
        	
        } 
        
        function _imageLoaded(evt) {
        	var image = evt.target;

    		_css(_internalSelector(), {
    			'background-image': image.src,
    			'background-position': "0 0",
    			width: image.width,
    			height: image.height
    		});
        	
        }
        
        this.load = function(thumbsVTT) {
        	_loadVTT(thumbsVTT);
        }
        
        this.element = function() {
            return _display;
        }
        
        // Update display
        var _updateTimeline = this.updateTimeline = function(seconds) {
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
        
        _init();

    };


})(jwplayer.html5);
