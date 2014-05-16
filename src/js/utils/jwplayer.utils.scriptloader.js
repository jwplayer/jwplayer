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
		var _events = jwplayer.events,
			_this = utils.extend(this, new _events.eventdispatcher()),
			_status = _loaderstatus.NEW;
		
		this.load = function() {
			if (_status == _loaderstatus.NEW) {
				// If we already have a scriptloader loading the same script, don't create a new one;
				var sameLoader = utils.scriptloader.loaders[url];
				if (sameLoader) {
					_status = sameLoader.getStatus();
					if (_status < 2) {
						// dispatch to this instances listeners when the first loader gets updates
						sameLoader.addEventListener(_events.ERROR, _sendError);
						sameLoader.addEventListener(_events.COMPLETE, _sendComplete);
						return;
					}
					// already errored or loaded... keep going?
				}
				
				var scriptTag = DOCUMENT.createElement("script");
				// Most browsers
				if (scriptTag.addEventListener) {
					scriptTag.onload = _sendComplete;
					scriptTag.onerror = _sendError;
				}
				else if (scriptTag.readyState) {
					// IE
					scriptTag.onreadystatechange = function(evt) {
						if (scriptTag.readyState == 'loaded' || scriptTag.readyState == 'complete') {
							_sendComplete(evt);
						}
						// Error?
					};
				}
				DOCUMENT.getElementsByTagName("head")[0].appendChild(scriptTag);
				scriptTag.src = url;

				_status = _loaderstatus.LOADING;
				utils.scriptloader.loaders[url] = this;
			}
			
		};
		
		function _sendError(evt) {
			_status = _loaderstatus.ERROR;
			_this.sendEvent(_events.ERROR, evt);
		}
		
		function _sendComplete(evt) {
			_status = _loaderstatus.COMPLETE;
			_this.sendEvent(_events.COMPLETE, evt);
		}

		
		this.getStatus = function() {
			return _status;
		};
	};
	
	utils.scriptloader.loaders = {};
})(jwplayer.utils);
