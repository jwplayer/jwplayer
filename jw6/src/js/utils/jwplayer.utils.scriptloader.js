/**
 * Loads a <script> tag
 * @author zach
 * @modified pablo
 * @version 6.0
 */
(function(utils) {

	var _loaderstatus = utils.loaderstatus = {
			NEW: 0,
			LOADING: 1,
			ERROR: 2,
			COMPLETE: 3
		},
		DOCUMENT = document;
	
	
	utils.scriptloader = function(url) {
		var _status = _loaderstatus.NEW,
			_events = jwplayer.events,
			_eventDispatcher = new _events.eventdispatcher();
		
		utils.extend(this, _eventDispatcher);
		
		this.load = function() {
			var sameLoader = utils.scriptloader.loaders[url];
			if (sameLoader && (sameLoader.getStatus() == _loaderstatus.NEW || sameLoader.getStatus() == _loaderstatus.LOADING)) {
				// If we already have a scriptloader loading the same script, don't create a new one;
				sameLoader.addEventListener(_events.ERROR, _sendError);
				sameLoader.addEventListener(_events.COMPLETE, _sendComplete);
				return;
			}
			
			utils.scriptloader.loaders[url] = this;
			
			if (_status == _loaderstatus.NEW) {
				_status = _loaderstatus.LOADING;
				var scriptTag = DOCUMENT.createElement("script");
				// Most browsers
				if (scriptTag.addEventListener) {
					scriptTag.onload = _sendComplete;
					scriptTag.onerror = _sendError;
				}
				else if (scriptTag.readyState) {
					// IE
					scriptTag.onreadystatechange = function() {
						if (scriptTag.readyState == 'loaded' || scriptTag.readyState == 'complete') {
							_sendComplete();
						}
						// Error?
					}
				}
				DOCUMENT.getElementsByTagName("head")[0].appendChild(scriptTag);
				scriptTag.src = url;
			}
			
		};
		
		function _sendError(evt) {
			_status = _loaderstatus.ERROR;
			_eventDispatcher.sendEvent(_events.ERROR);
		}
		
		function _sendComplete(evt) {
			_status = _loaderstatus.COMPLETE;
			_eventDispatcher.sendEvent(_events.COMPLETE);
		}

		
		this.getStatus = function() {
			return _status;
		}
	}
	
	utils.scriptloader.loaders = {};
})(jwplayer.utils);
