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
		_events = jwplayer.events,
		DOCUMENT = document;
	
	
	utils.scriptloader = function(url) {
		var _status = _loaderstatus.NEW;
		var _eventDispatcher = new _events.eventdispatcher();
		utils.extend(this, _eventDispatcher);
		
		this.load = function() {
			if (_status == _loaderstatus.NEW) {
				_status = _loaderstatus.LOADING;
				var scriptTag = DOCUMENT.createElement("script");
				// Most browsers
				scriptTag.onload = function(evt) {
					_status = _loaderstatus.COMPLETE;
					_eventDispatcher.sendEvent(_events.COMPLETE);
				}
				scriptTag.onerror = function(evt) {
					_status = _loaderstatus.ERROR;
					_eventDispatcher.sendEvent(_events.ERROR);
				}
				// IE
				scriptTag.onreadystatechange = function() {
					if (scriptTag.readyState == 'loaded' || scriptTag.readyState == 'complete') {
						_status = _loaderstatus.COMPLETE;
						_eventDispatcher.sendEvent(_events.COMPLETE);
					}
					// Error?
				}
				DOCUMENT.getElementsByTagName("head")[0].appendChild(scriptTag);
				scriptTag.src = url;
			}
			
		};
		
		this.getStatus = function() {
			return _status;
		}
	}
})(jwplayer.utils);
