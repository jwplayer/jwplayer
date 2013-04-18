/** 
 * API to control instream playback without interrupting currently playing video
 *
 * @author pablo
 * @version 6.0
 */
(function(html5) {
	var _jw = jwplayer, 
		_utils = _jw.utils, 
		_events = _jw.events, 
		_states = _events.state,
		_playlist = _jw.playlist;
	
	html5.instream = function(api, model, view, controller) {
		var _defaultOptions = {
			controlbarseekable:"never",
			controlbarpausable:true,
			controlbarstoppable:true,
			playlistclickable:true
		};
		
		var _item,
			_options,
			_api=api, _model=model, _view=view, _controller=controller,
			_video, _oldsrc, _oldsources, _oldpos, _oldstate, _olditem,
			_provider, _cbar, _disp, _instreamMode = false,
			_dispatcher, _instreamContainer, _fakemodel,
			_self = this, _loadError = false, _shouldSeek = true;


		/*****************************************
		 *****  Public instream API methods  *****
		 *****************************************/

		/** Load an instream item and initialize playback **/
		this.load = function(item, options) {
			if (_utils.isAndroid(2.3)) {
				errorHandler({
					type: _events.JWPLAYER_ERROR,
					message: "Error loading instream: Cannot play instream on Android 2.3"
				});
				return;
			}
			
			// Sets internal instream mode to true
			_instreamMode = true;
			// Instream playback options
			_options = _utils.extend(_defaultOptions, options);
			// Copy the playlist item passed in and make sure it's formatted as a proper playlist item
			_item = new _playlist.item(item);
			// Create the container in which the controls will be placed
			_instreamContainer = document.createElement("div");
			_instreamContainer.id = _self.id + "_instream_container";
			// Make sure the original player's provider stops broadcasting events (pseudo-lock...)
			_video = _controller.detachMedia();
			// Create (or reuse) video media provider.  No checks right now to make sure it's a valid playlist item (i.e. provider="video").
			_setupProvider();
			// Initialize the instream player's model copied from main player's model
			_fakemodel = new html5.model({}, _provider);
			// Update the instream player's model
			_copyModel();
			_fakemodel.addEventListener(_events.JWPLAYER_ERROR,errorHandler)
			// Set the new model's playlist
			_olditem = _model.playlist[_model.item];
                // Keep track of the original player state
            _oldstate = _model.getVideo().checkComplete() ? _states.IDLE : api.jwGetState();
            if (_controller.checkBeforePlay()) {
                _oldstate = _states.PLAYING;
                _shouldSeek = false;
            }
			_oldsrc = _video.src ? _video.src : _video.currentSrc;
            _oldsources = _video.innerHTML;
            _oldpos = _video.currentTime;
            _fakemodel.setPlaylist([item]);                
			// Store this to compare later (in case the main player switches to the next playlist item when we switch out of instream playback mode 
			if (!_loadError){

    			// If the player's currently playing, pause the video tag
    			if (_oldstate == _states.BUFFERING || _oldstate == _states.PLAYING) {
    				_video.pause();
    	        } 
    			
    			// Copy the video src/sources tags and store the current playback time

    			// Instream display component
    			_disp = new html5.display(_self);
    			_disp.setAlternateClickHandler(function(evt) {
    				if (_fakemodel.state == _states.PAUSED) {
    					_self.jwInstreamPlay();
    				} else {
    					_self.jwInstreamPause();
    					_sendEvent(_events.JWPLAYER_INSTREAM_CLICK, evt);
    				}
    			});
    
    			_instreamContainer.appendChild(_disp.element());
    
    			// Instream controlbar (if not iOS/Android)
    			if (!_utils.isMobile()) {
    				_cbar = new html5.controlbar(_self);
    				_instreamContainer.appendChild(_cbar.element());
    				_cbar.show();
    			}
    
    			// Show the instream layer
    			_view.setupInstream(_instreamContainer, _video);
    			// Resize the instream components to the proper size
    			_resize();
    			// Load the instream item
    			_provider.load(_fakemodel.playlist[0]);
    		}
			
		}
	   
	    function errorHandler(evt) {
	        _sendEvent(evt.type,evt);
	        _loadError = true;
	        _self.jwInstreamDestroy(false);
	    }
		/** Stop the instream playback and revert the main player back to its original state **/
		this.jwInstreamDestroy = function(complete) {
			if (!_instreamMode) return;
			// We're not in instream mode anymore.
			_instreamMode = false;
			// Load the original item into our provider, which sets up the regular player's video tag
			if (_oldstate != _states.IDLE) {
				_provider.load(_olditem, false);
			} else {
				_provider.stop();
			}
            _dispatcher.resetEventListeners();
			// Reverting instream click handler --for some reason throws an error if there was an error loading instream
			if (!_loadError)
			     _disp.revertAlternateClickHandler();
			// We don't want the instream provider to be attached to the video tag anymore
			_provider.detachMedia();
			// Return the view to its normal state
			_view.destroyInstream();
			// If we added the controlbar anywhere, let's get rid of it
			if (_cbar) try { _cbar.element().parentNode.removeChild(_cbar.getDisplayElement()); } catch(e) {}
			// Let listeners know the instream player has been destroyed, and why
			_sendEvent(_events.JWPLAYER_INSTREAM_DESTROYED, {reason:(complete ? "complete":"destroyed")}, true);
			// Re-attach the controller
			_controller.attachMedia();
			if (_oldstate == _states.BUFFERING || _oldstate == _states.PLAYING) {
				// Model was already correct; just resume playback
				_video.play();
				if (_model.playlist[_model.item] == _olditem) {
					// We need to seek using the player's real provider, since the seek may have to be delayed
					if (_shouldSeek) _model.getVideo().seek(_oldpos);
				}
			}
			return;
		};
		
		/** Forward any calls to add and remove events directly to our event dispatcher **/
		
		this.jwInstreamAddEventListener = function(type, listener) {
			_dispatcher.addEventListener(type, listener);
		} 
		this.jwInstreamRemoveEventListener = function(type, listener) {
			_dispatcher.removeEventListener(type, listener);
		}

		/** Start instream playback **/
		this.jwInstreamPlay = function() {
			if (!_instreamMode) return;
			_provider.play(true);
			_model.state = jwplayer.events.state.PLAYING;
			_disp.show();  
		}

		/** Pause instream playback **/
		this.jwInstreamPause = function() {
			if (!_instreamMode) return;
			_provider.pause(true);
			_model.state = jwplayer.events.state.PAUSED;
			_disp.show();
		}
		
		/** Seek to a point in instream media **/
		this.jwInstreamSeek = function(position) {
			if (!_instreamMode) return;
			_provider.seek(position);
		}
		
		/** Get the current instream state **/
		/*
		this.jwInstreamGetState = function() {
			if (!_instreamMode) return undefined;
			return _fakemodel.state;
		}
		*/

		/** Get the current instream playback position **/
		/*
		this.jwInstreamGetPosition = function() {
			if (!_instreamMode) return undefined;
			return _fakemodel.position;
		}
		*/

		/** Get the current instream media duration **/
		/*
		this.jwInstreamGetDuration = function() {
			if (!_instreamMode) return undefined;
			return _fakemodel.duration;
		}
		
		this.playlistClickable = function() {
			return (!_instreamMode || _options.playlistclickable.toString().toLowerCase()=="true");
		}
		*/

		/*****************************
		 ****** Private methods ****** 
		 *****************************/

		function _init() {
			// Create new event dispatcher
			_dispatcher = new _events.eventdispatcher();
			// Listen for player resize events
			_api.jwAddEventListener(_events.JWPLAYER_RESIZE, _resize);
			_api.jwAddEventListener(_events.JWPLAYER_FULLSCREEN, _fullscreenHandler);
		}

		function _copyModel() {
			_fakemodel.setVolume(_model.volume);
			_fakemodel.setMute(_model.mute);
		}
		
		function _setupProvider() {
			//if (!_provider) {
				_provider = new html5.video(_video);
				_provider.addGlobalListener(_forward);
				_provider.addEventListener(_events.JWPLAYER_MEDIA_META, _metaHandler);
				_provider.addEventListener(_events.JWPLAYER_MEDIA_COMPLETE, _completeHandler);
				_provider.addEventListener(_events.JWPLAYER_MEDIA_BUFFER_FULL, _bufferFullHandler);
			//}
			_provider.attachMedia();
			_provider.mute(_model.mute);
			_provider.volume(_model.volume);
		}
		
		/** Forward provider events to listeners **/		
		function _forward(evt) {
			if (_instreamMode) {
				_sendEvent(evt.type, evt);
			}
		}

		function _fullscreenHandler(evt) {
			_forward(evt);
			_resize();
		}
		
		/** Handle the JWPLAYER_MEDIA_BUFFER_FULL event **/		
		function _bufferFullHandler(evt) {
			if (_instreamMode) {
				_provider.play();
			}
		}

		/** Handle the JWPLAYER_MEDIA_COMPLETE event **/		
		function _completeHandler(evt) {
			if (_instreamMode) {
				setTimeout(function() {
					_self.jwInstreamDestroy(true);
				}, 10);
			}
		}

		/** Handle the JWPLAYER_MEDIA_META event **/		
		function _metaHandler(evt) {
			// If we're getting video dimension metadata from the provider, allow the view to resize the media
			if (evt.width && evt.height) {
				_view.resizeMedia();
			}
		}
		
		function _sendEvent(type, data, forceSend) {
			if (_instreamMode || forceSend) {
				_dispatcher.sendEvent(type, data);
			}
		}
		
		// Resize handler; resize the components.
		function _resize() {
			if (_cbar) {
				_cbar.redraw();
			}
			if (_disp) {
				_disp.redraw();
			}
		}
		
		
		/**************************************
		 *****  Duplicate main html5 api  *****
		 **************************************/
		
		this.jwPlay = function(state) {
			if (_options.controlbarpausable.toString().toLowerCase()=="true") {
				this.jwInstreamPlay();
			}
		};
		
		this.jwPause = function(state) {
			if (_options.controlbarpausable.toString().toLowerCase()=="true") {
				this.jwInstreamPause();
			}
		};

		this.jwStop = function() {
			if (_options.controlbarstoppable.toString().toLowerCase()=="true") {
				this.jwInstreamDestroy();
				_api.jwStop();
			}
		};

		this.jwSeek = function(position) {
			switch(_options.controlbarseekable.toLowerCase()) {
			case "never":
				return;
			case "always":
				this.jwInstreamSeek(position);
				break;
			case "backwards":
				if (_fakemodel.position > position) {
					this.jwInstreamSeek(position);
				}
				break;
			}
		};
		
		this.jwSeekDrag = function(state) { _fakemodel.seekDrag(state); };
		
		this.jwGetPosition = function() {};
		this.jwGetDuration = function() {};
		this.jwGetWidth = _api.jwGetWidth;
		this.jwGetHeight = _api.jwGetHeight;
		this.jwGetFullscreen = _api.jwGetFullscreen;
		this.jwSetFullscreen = _api.jwSetFullscreen;
		this.jwGetVolume = function() { return _model.volume; };
		this.jwSetVolume = function(vol) {
			_fakemodel.setVolume(vol);
			_api.jwSetVolume(vol);
		}
		this.jwGetMute = function() { return _model.mute; };
		this.jwSetMute = function(state) {
			_fakemodel.setMute(state);
			_api.jwSetMute(state);
		}
		this.jwGetState = function() { return _model.state; };
		this.jwGetPlaylist = function() { return [_item]; };
		this.jwGetPlaylistIndex = function() { return 0; };
		this.jwGetStretching = function() { return _model.config.stretching; };
		this.jwAddEventListener = function(type, handler) { _dispatcher.addEventListener(type, handler); };
		this.jwRemoveEventListener = function(type, handler) { _dispatcher.removeEventListener(type, handler); };
		this.jwSetCurrentQuality = function() {};
		this.jwGetQualityLevels = function() { return [] };

		this.skin = _api.skin;
		this.id = _api.id + "_instream";

		_init();
		return this;
	};
})(jwplayer.html5);

