package com.longtailvideo.jwplayer.media {
    import com.longtailvideo.jwplayer.events.MediaEvent;
    import com.longtailvideo.jwplayer.events.PlayerEvent;
    import com.longtailvideo.jwplayer.model.PlayerConfig;
    import com.longtailvideo.jwplayer.model.PlaylistItem;
    import com.longtailvideo.jwplayer.model.PlaylistItemLevel;
    import com.longtailvideo.jwplayer.parsers.LoadbalanceParser;
    import com.longtailvideo.jwplayer.player.PlayerState;
    import com.longtailvideo.jwplayer.utils.*;
    import com.wowza.encryptionAS3.TEA;
    
    import flash.events.*;
	import flash.external.ExternalInterface;
    import flash.media.*;
    import flash.net.*;
    import flash.utils.*;


	/**
	 * Wrapper for playback of media streamed over RTMP.
	**/
	public class RTMPMediaProvider extends MediaProvider {
		/** The RTMP application URL. **/
		private var _application:String;
		/** The last bandwidth measurement. **/
		private var _bandwidth:Number;
		/** The netconnection instance **/
		private var _connection:NetConnection;
		/** The currently active stream ID. **/
		private var _id:String;
        /** ID for the position interval. **/
        private var _positionInterval:Number;
		/** Loader for loading SMIL files. **/
		private var _loader:AssetLoader;
		/** Flag for metadata received. **/
		private var _metadata:Boolean;
		/** NetStream instance that handles the stream IO. **/
		private var _stream:NetStream;
        /** Number of subcription attempts. **/
        private var _subscribeCount:Number = 0;
        /** Interval ID for subscription pings. **/
        private var _subscribeInterval:Number;
        /** Sound control object. **/
        private var _transformer:SoundTransform;
        /** Level to which we're transitioning. **/
        private var _transitionLevel:Number = -1;
        /** Video object to be instantiated. **/
        private var _video:Video;
		/** Number of frames dropped at present. **/
		private var _streamInfo:Array;
		/** Interval for bw checking - with dynamic streaming. **/
		private var _streamInfoInterval:Number;


		/** Initialize RTMP provider. **/
		public function RTMPMediaProvider() {
			super('rtmp');
		}


		/** Constructor; sets up the connection and display. **/
		public override function initializeMediaProvider(cfg:PlayerConfig):void {
			super.initializeMediaProvider(cfg);
			_connection = new NetConnection();
			_connection.addEventListener(NetStatusEvent.NET_STATUS, statusHandler);
			_connection.addEventListener(SecurityErrorEvent.SECURITY_ERROR, errorHandler);
			_connection.addEventListener(IOErrorEvent.IO_ERROR, errorHandler);
			_connection.addEventListener(AsyncErrorEvent.ASYNC_ERROR, errorHandler);
			_connection.objectEncoding = ObjectEncoding.AMF0;
			_connection.client = new NetClient(this);
			_loader = new AssetLoader();
			_loader.addEventListener(Event.COMPLETE, loaderComplete);
			_loader.addEventListener(ErrorEvent.ERROR, loaderError);
			_transformer = new SoundTransform();
			_video = new Video(320, 240);
			_video.smoothing = true;
		}


		/** Try subscribing to livestream **/
		private function doSubscribe():void {
			_subscribeCount++;
			if(_subscribeCount > 3) {
				clearInterval(_subscribeInterval);
				error("Error loading stream: Stream not found on server");
			} else {
				_connection.call("FCSubscribe", null, _id);
			}
		};


		/** Catch security errors. **/
		private function errorHandler(evt:ErrorEvent):void {
			stop();
			sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_ERROR, {message: evt.text});
		}


		/** Bandwidth and Framedrop checking for dynamic streaming. **/
		private function getStreamInfo():void {
			if (!_stream) {
				clearInterval(_streamInfoInterval);
				return;
			}
			try {
				var bwd:Number = Math.round(_stream.info.maxBytesPerSecond * 8 / 1024);
				_streamInfo.push({bwd:bwd});
				var len:Number = _streamInfo.length;
				if(len > 5 && state == PlayerState.PLAYING) {
					bwd = Math.round((_streamInfo[len-1].bwd + _streamInfo[len-2].bwd + _streamInfo[len-3].bwd + 
						_streamInfo[len-4].bwd+ + _streamInfo[len-5].bwd)/5);
					if(item.levels.length > 0 && getLevel(item, bwd,config.width) != item.currentLevel) {
						Logger.log("swapping to another level b/c of bandwidth",bwd.toString());
						swap(getLevel(item, bwd, config.width));
					}
					sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_META, {metadata: { bandwidth: bwd }});
				}
			} catch(e:Error) {
				Logger.log("There was an error attempting to get stream info: " + e.message);
			}
		};


		/** Load content. **/
		override public function load(itm:PlaylistItem):void {
			_item = itm;
			_position = 0;
			// Load either file or manifest
			if (_item.file.substr(0,4) == 'rtmp') {
				// Split application and stream
				var definst:Number = _item.file.indexOf('_definst_');
				var prefix:Number = Math.max(_item.file.indexOf('mp4:'),_item.file.indexOf('mp3:'));
				var slash:Number = _item.file.lastIndexOf('/');
				if (definst > 0) {
					_application = _item.file.substr(0, definst + 10);
					_id = loadID(_item.file.substr(definst + 10));
				} else if (prefix > -1 ) {
					_application = _item.file.substr(0, prefix);
					_id = loadID(_item.file.substr(prefix));
				} else {
					_application = _item.file.substr(0, slash+1);
					_id = loadID(_item.file.substr(slash+1));
				}
				loadWrap();
			} else {
				// if (item.levels.length > 0) { item.setLevel(getLevel(item, config.bandwidth, config.width)); }
				_loader.load(_item.file, XML);
			}
			setState(PlayerState.BUFFERING);
		}


		/** Get one or more levels from the loadbalancing XML. **/
		private function loaderComplete(evt:Event):void {
			var arr:Array = LoadbalanceParser.parse((evt.target as AssetLoader).loadedObject);
			/*
			var smilLocation:String = _xmlLoaders[evt.target];
			delete _xmlLoaders[evt.target];
			if(arr.length > 1) {
				item.clearLevels()
				for(var i:Number=0; i<arr.length; i++) { item.addLevel(arr[i]); }
				item.setLevel(getLevel(item, config.bandwidth, config.width));
			} else if (item.levels.length > 0) {
				var level:PlaylistItemLevel = item.levels[(item.smil as Array).indexOf(smilLocation)] as PlaylistItemLevel;
				_application = arr[0].streamer;
				level.file = arr[0].file;
			} else {
				_application = arr[0].streamer;
				item.file = arr[0].file;
			}
			*/
			loadWrap();
		};


		/** Error handler for manifest loader. **/
		private function loaderError(evt:ErrorEvent):void {
			error("Error loading stream: Could not load manifest");
		}


		/** Extract the correct rtmp syntax from the file string. **/
		private function loadID(url:String):String {
			var parts:Array = url.split("?");
			var ext:String = parts[0].substr(-4);
			parts[0] = parts[0].substr(0, parts[0].length-4);
			if (url.indexOf(':') > -1) {
				return url;
			} else if (ext == '.mp3') {
				return 'mp3:' + parts.join("?");
			} else if (ext == '.mp4' || ext == '.m4v' || ext == '.f4v'
				|| ext == 'aac' || ext == '.m4a' || ext == '.f4a') {
				return 'mp4:' + url;
			} else if (ext == '.flv') {
				return parts.join("?");
			} else {
				return url;
			}
		}


		/** Finalizes the loading process **/
		private function loadWrap():void {
			// Only set media object for video streams
			var ext:String = Strings.extension(_item.file);
			if (item.file.substr(0,4) == 'mp3:' || ext == 'aac' || ext == 'm4a') {
				media = null;
			} else if (!media) {
				media = _video;
			}
			// Connect to RTMP server
			try {
				_connection.connect(_application);
				sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_LOADED);
			} catch(e:Error) {
				error("Error loading stream: Could not connect to server");
			}
		}


		/** Get metadata information from netstream class. **/
		public function onClientData(data:Object):void {
			// Reset transition level for next transition.
			if (data.code == 'NetStream.Play.TransitionComplete') {
				if (_transitionLevel >= 0) { _transitionLevel = -1; }
			} 
			// Store video metadata.
			if (data.type == "metadata") {
				if (data.duration && !_metadata) {
					_item.duration = data.duration;
					if(_item.start) {
						seek(_item.start);
					}
				}
				_metadata = true;
				if (data.width) {
					_video.width = data.width;
					_video.height = data.height;
					super.resize(_width, _height);
				}
			}
			// Subscription success/failure
			if (data.type == 'fcsubscribe') {
				if (data.code == "NetStream.Play.Start") {
					setStream();
				} else {
					error("Error loading stream: Stream not found on server");
				}
				clearInterval(_subscribeInterval);
			}
			// This one shouldn't be needed for RTMP.
			if (data.type == 'complete') {
				ExternalInterface.call("console.log", "netstream completion called");
				stop();
				sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_COMPLETE);
			}
			sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_META, {metadata: data});
		}


		/** Pause playback. **/
		override public function pause():void {
			_stream.pause();
			clearInterval(_positionInterval);
			setState(PlayerState.PAUSED);
		};


		/** Resume playing. **/
		override public function play():void {
			if(_metadata) { 
				_stream.resume();
			} else {
				_stream.play(_id);
			}
			setState(PlayerState.PLAYING);
			// _streamInfo = new Array();
			// clearInterval(_streamInfoInterval);
			// _streamInfoInterval = setInterval(getStreamInfo, 1000);
			clearInterval(_positionInterval);
			_positionInterval = setInterval(positionInterval, 100);
			ExternalInterface.call("console.log", "play() is called");
		}


		/** Interval for the position progress. **/
		private function positionInterval():void {
			var pos:Number = Math.round((_stream.time) * 10) / 10;
			var bfr:Number = _stream.bufferLength / _stream.bufferTime;
			var bwd:Number = Math.round(_stream.info.maxBytesPerSecond*8/1024);
			// Toggle between buffering and playback states
			if (bfr < 0.5 && pos < _item.duration - 5 && state != PlayerState.BUFFERING) {
				setState(PlayerState.BUFFERING);
			} else if (bfr > 0.5 && state != PlayerState.PLAYING) {
				setState(PlayerState.PLAYING);
			}
			// Send time ticks when playing
			if (state == PlayerState.PLAYING) {
				_position = pos;
				sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_TIME, {position: pos, duration: _item.duration});
			}
			// Send out bandwidth events if the buffer is full and the BW actually changed.
			if(Math.round(pos) == pos && bfr > 1 && bwd != _bandwidth) {
				if(!_bandwidth) { _bandwidth = bwd; }
				// Add a damper to smooth out crazy bandwidth estimations.
				_bandwidth = Math.round((bwd + _bandwidth * 2) / 3);
				ExternalInterface.call("console.log", "bandwidth: "+_bandwidth);
			}
		}


		/** Check if the level must be switched on resize. **/
		override public function resize(width:Number, height:Number):void {
			super.resize(width, height);
			if (state == PlayerState.PLAYING) {
				if (item.levels.length > 0 && item.currentLevel != getLevel(item, config.bandwidth, config.width)) {
					Logger.log("swapping to another level b/c of size: "+config.width);
					swap(getLevel(item, config.bandwidth, config.width));
				}
			}
		}


		/** Seek to a new position. **/
		override public function seek(pos:Number):void {
			_transitionLevel = -1;
			if (item.levels.length > 0 && getLevel(item, config.bandwidth, config.width) != item.currentLevel) {
				item.setLevel(getLevel(item, config.bandwidth, config.width));
			}
			if(state == PlayerState.PAUSED) {
				play();
			}
			setState(PlayerState.BUFFERING);
			_stream.seek(pos);
			clearInterval(_positionInterval);
			_positionInterval = setInterval(positionInterval, 100);
		}


		/** Init NetStream after the connection is setup. **/
		private function setStream():void {
			_stream = new NetStream(_connection);
			_stream.addEventListener(NetStatusEvent.NET_STATUS, statusHandler);
			_stream.addEventListener(IOErrorEvent.IO_ERROR, errorHandler);
			_stream.addEventListener(AsyncErrorEvent.ASYNC_ERROR, errorHandler);
			// Set configurable bufferlength or default.
			if (getConfigProperty('bufferlength')) {
				_stream.bufferTime = getConfigProperty('bufferlength');
			} else {
				_stream.bufferTime = 2;
			}
			_stream.client = new NetClient(this);
			_video.attachNetStream(_stream);
			streamVolume(config.mute ? 0 : config.volume);
			// This will trigger a play() of the video.
			sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_BUFFER_FULL);
		};


		/** Receive NetStream status updates. **/
		private function statusHandler(evt:NetStatusEvent):void {
			switch (evt.info.code) {
				case 'NetConnection.Connect.Success':
					// Do securetoken call.
					if (evt.info.secureToken != undefined) {
						var hash:String = TEA.decrypt(evt.info.secureToken, getConfigProperty('securetoken'));
						_connection.call("secureTokenResponse", null, hash);
					}
					// Get streamlength for MP3, since FMS doesn't send MP3 metadata.
					if(_id.substr(0,4) == 'mp3:') {
						_connection.call("getStreamLength", new Responder(streamlengthHandler), _id);
					}
					//	Do live stream subscription, for Edgecast/Limelight.
					if (getConfigProperty('subscribe')) {
						_subscribeInterval = setInterval(doSubscribe, 2000);
					} else {
						// No subscription? Then simply setup the connection.
						setStream();
					}
					break;
				// Server cannot be reached (anymore)
				case 'NetConnection.Connect.Rejected':
				case 'NetConnection.Connect.Failed':
					error("Error loading stream: Could not connect to server");
					break;
				// Server connected, but stream failed.
				case 'NetStream.Seek.Failed':
				case 'NetStream.Failed':
				case 'NetStream.Play.StreamNotFound':
					error("Error loading stream: Stream not found on server");
					break;
				// Maybe needed for live? Not for VOD...
				case 'NetStream.Play.Stop':
				case 'NetStream.Play.UnpublishNotify':
					//stop();
					//sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_COMPLETE);
					//ExternalInterface.call("console.log", "playback completed");
					break;
				// Wowza automatically closes connection after a timeout
				case 'NetConnection.Connect.Closed':
					if(state == PlayerState.PAUSED) {
						ExternalInterface.call("console.log", "connection closed");
						stop();
					}
					break;
				case 'NetStream.Play.Transition':
					// We shouldn't need this one
					// onClientData(evt.info);
					break;
			}
		}


		/** Close the stream; reset all variables. **/
		override public function stop():void {
			if (_stream && _stream.time) {
				_stream.close();
			}
			_stream = null;
			_application = _id = undefined;
			_metadata = false;
			_connection.close();
			clearInterval(_positionInterval);
			_position = _subscribeCount = 0;
			_streamInfo = new Array();
			clearInterval(_streamInfoInterval);
			super.stop();
		}


		/** Get the streamlength returned from the connection. **/
		private function streamlengthHandler(length:Number):void {
			_item.duration = length;
		}


		/** Dynamically switch streams **/
		private function swap(newLevel:Number):void {
			if (_transitionLevel == -1 && (newLevel < item.currentLevel ||
				_stream.bufferLength < _stream.bufferTime * 1.5)) {
				_transitionLevel = newLevel;
				item.setLevel(newLevel);
				var nso:NetStreamPlayOptions = new NetStreamPlayOptions();
				nso.streamName = _id;
				nso.transition = NetStreamPlayTransitions.SWITCH;
				clearInterval(_streamInfoInterval);
				_streamInfo = new Array();
				_streamInfoInterval = setInterval(getStreamInfo, 1000);
				_stream.play2(nso);
			}
		}


		/** Set the volume level. **/
		override public function setVolume(vol:Number):void {
			streamVolume(vol);
			super.setVolume(vol);
		}


		/** Set the stream's volume, without sending a volume event **/
		protected function streamVolume(level:Number):void {
			_transformer.volume = level / 100;
			if (_stream) {
				_stream.soundTransform = _transformer;
			}
		}


		/** Determines if the stream is a live stream **/
		protected function get isLivestream():Boolean {
			// We assume it's a livestream until we hear otherwise.
			return (!(_item.duration > 0) && _stream);
		}


    }
}