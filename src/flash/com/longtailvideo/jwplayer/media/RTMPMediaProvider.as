package com.longtailvideo.jwplayer.media {
    import com.longtailvideo.jwplayer.events.MediaEvent;
    import com.longtailvideo.jwplayer.events.PlayerEvent;
    import com.longtailvideo.jwplayer.model.PlayerConfig;
    import com.longtailvideo.jwplayer.model.PlaylistItem;
    import com.longtailvideo.jwplayer.model.PlaylistItemLevel;
    import com.longtailvideo.jwplayer.parsers.SMILParser;
    import com.longtailvideo.jwplayer.player.PlayerState;
    import com.longtailvideo.jwplayer.utils.*;
    import com.wowza.encryptionAS3.TEA;
    
    import flash.events.*;
	import flash.external.ExternalInterface;
	import flash.geom.Rectangle;
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
        private var _interval:Number;
		/** Loader for loading SMIL files. **/
		private var _loader:AssetLoader;
		/** Flag for metadata received. **/
		private var _metadata:Boolean;
		/** NetStream instance that handles playback. **/
		private var _stream:NetStream;
		/** Sound control object. **/
		private var _transformer:SoundTransform;
		/** Level to transition to. **/
		private var _transitionLevel:Number = -1;
		/** Video object to be instantiated. **/
		private var _video:Video;
		/** StageVideo object to be instantiated. **/
		private var _stage:Object;
		/** Video type that's detected. **/
		private var _type:String;
		/** Array with quality levels. **/
		private var _levels:Array;


		/** Initialize RTMP provider. **/
		public function RTMPMediaProvider() {
			super('rtmp');
			_stretch = false;
		}


		/** Constructor; sets up the connection and loader. **/
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
		}


		/** Catch security errors. **/
		private function errorHandler(evt:ErrorEvent):void {
			error(evt.text);
		}


		/** Send out video render state. **/
		protected function renderHandler(event:Event):void {
			var stagevideo:String = 'off';
			if (_stage) { stagevideo = 'on'; }
			sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_META, {metadata: {
				stagevideo: stagevideo,
				renderstate: event['status']
			}});
		};


		/** Load content. **/
		override public function load(itm:PlaylistItem):void {
			_item = itm;
			_position = 0;
			// Set Video or StageVideo
			if(!_video) { 
				_video = new Video(320, 240);
				_video.smoothing = true;
				_video.addEventListener('renderState', renderHandler);
				// Use stageVideo when available
				if (RootReference.stage['stageVideos'].length > 0) {
					_stage = RootReference.stage['stageVideos'][0];
					_stage.viewPort = new Rectangle(0,0,320,240);
					_stage.addEventListener('renderState', renderHandler);
					_stage.attachNetStream(_stream);
				} else {
					_video.attachNetStream(_stream);
				}
			}
			// Load either file, streamer or manifest
			if (_item.file.substr(0,4) == 'rtmp') {
				// Split application and stream
				var definst:Number = _item.file.indexOf('_definst_');
				var prefix:Number = Math.max(_item.file.indexOf('mp4:'),
					_item.file.indexOf('mp3:'),_item.file.indexOf('flv:'));
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
			} else if(_item.streamer) {
				_application = _item.streamer;
				_id = loadID(_item.file);
				loadWrap();
			} else {
				// if (item.levels.length > 0) { item.setLevel(getLevel(item, config.bandwidth, config.width)); }
				_loader.load(_item.file, XML);
			}
			setState(PlayerState.BUFFERING);
		}


		/** Get one or more levels from the loadbalancing XML. **/
		private function loaderComplete(evt:Event):void {
			var xml:XML = (evt.target as AssetLoader).loadedObject;
			// Grab the RTMP application from head > meta@base.
			var app:String = SMILParser.parseApplication(xml);
			if(app.length > 10) {
				_application = app;
			} else {
				error("Error loading stream: Manifest not found or invalid");
			}
			// Grab the quality levels from body > node.
			var lvl:Array = SMILParser.parseLevels(xml);
			if(lvl.length > 0) {
				_levels = lvl;
				_id = loadID(lvl[0].id);
				loadWrap();
			} else {
				error("Error loading stream: Manifest not found or invalid");
			}
		};


		/** Error handler for manifest loader. **/
		private function loaderError(evt:ErrorEvent):void {
			error("Error loading stream: Manifest not found or invalid");
		}


		/** Extract the correct rtmp syntax from the file string. **/
		private function loadID(url:String):String {
			var parts:Array = url.split("?");
			var extension:String = parts[0].substr(-4);
			switch (extension) {
				case '.flv':
					_type = 'flv';
					parts[0] = parts[0].substr(0, parts[0].length-4);
					parts[0].indexOf('flv:') == 0 ? parts[0] = parts[0].substr(4): null;
					url = parts.join("?");
					break;
				case '.mp3':
					_type = 'mp3';
					parts[0] = parts[0].substr(0, parts[0].length-4);
					parts[0].indexOf('mp3:') == 0 ? null: parts[0] = 'mp3:' + parts[0];
					url = parts.join("?");
					break;
				case '.mp4':
				case '.m4v':
				case '.f4v':
					_type = 'mp4';
					parts[0].indexOf('mp4:') == 0 ? null: parts[0] = 'mp4:' + parts[0];
					url = parts.join("?");
					break;
				case '.aac':
				case '.m4a':
				case '.f4a':
					_type = 'aac';
					parts[0].indexOf('mp4:') == 0 ? null: parts[0] = 'mp4:' + parts[0];
					url = parts.join("?");
					break;
			}
			return url;
		}


		/** Finalizes the loading process **/
		private function loadWrap():void {
			// Do not set media object for audio streams
			if (_type == 'aac' || _type == 'mp3') {
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
					resize(_config.width, _config.height);
				}
			}
			// Handle FC Subscribe callback for live streaming
			if (data.type == 'fcsubscribe') {
				if (data.code == "NetStream.Play.Start") {
					setStream();
				} else {
					error("Error loading stream: ID not found on server");
				}
				
			}
			// Stream completed playback (check to not send it after an error)
			if (data.type == 'complete' && state != PlayerState.IDLE) {
				stop();
				sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_COMPLETE);
			}
			sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_META, {metadata: data});
		}


		/** Pause playback. **/
		override public function pause():void {
			// Pause VOD or close live stream
			if(_item.duration > 0) {
				_stream.pause();
			} else { 
				_stream.close();
			}
			clearInterval(_interval);
			setState(PlayerState.PAUSED);
		};


		/** Resume playing. **/
		override public function play():void {
			if(_metadata) {
				// Resume VOD and restart live stream
				if(_item.duration > 0) {
					_stream.resume();
				} else {
					_stream.play(_id);
					setState(PlayerState.BUFFERING);
				}
			} else {
				// Start stream. If _type it is VOD for sure.
				if(_type) {
					_stream.play(_id,0);
				} else {
					_stream.play(_id);
				}
			}
			clearInterval(_interval);
			_interval = setInterval(positionInterval, 100);
		}


		/** Interval for the position progress. **/
		private function positionInterval():void {
			var pos:Number = Math.round((_stream.time) * 10) / 10;
			var bfr:Number = _stream.bufferLength / _stream.bufferTime;
			var bwd:Number = Math.round(_stream.info.maxBytesPerSecond*8/1024);
			// Toggle between buffering and playback states
			if (bfr < 0.5 && pos < _item.duration - 5 && state != PlayerState.BUFFERING) {
				setState(PlayerState.BUFFERING);
			} else if (bfr > 1 && state != PlayerState.PLAYING) {
				setState(PlayerState.PLAYING);
			}
			// Send time ticks when playing
			if (state == PlayerState.PLAYING) {
				_position = pos;
				sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_TIME, {position: pos, duration: _item.duration});
			}
			// Check bandwidth events every second if the buffer is filled.
			if(pos-Math.floor(pos) < 0.05 && bfr > 0.5) {
				_bandwidth = bwd;
				// ExternalInterface.call("console.log", "bandwidth: "+bwd+", bufferlength: "+bfr);
			}
		}


		/** Resize the Video and possible StageVideo. **/
		override public function resize(width:Number, height:Number):void {
			if(_media) {
				Stretcher.stretch(_media, width, height, _config.stretching);
				if (_stage) {
					_stage.viewPort = new Rectangle(_media.x,_media.y,_media.width,_media.height);
				}
			}
			/*
			if (state == PlayerState.PLAYING) {
				if (item.levels.length > 0 && item.currentLevel != getLevel(item, config.bandwidth, config.width)) {
					Logger.log("swapping to another level b/c of size: "+config.width);
					swap(getLevel(item, config.bandwidth, config.width));
				}
			}
			*/
		}


		/** Seek to a new position, only when duration is found. **/
		override public function seek(pos:Number):void {
			if(_item.duration > 0) {
				_transitionLevel = -1;
				if (item.levels.length > 0 && getLevel(item, config.bandwidth, config.width) != item.currentLevel) {
					item.setLevel(getLevel(item, config.bandwidth, config.width));
				}
				if(state != PlayerState.PLAYING) {
					play();
				}
				setState(PlayerState.BUFFERING);
				_stream.seek(pos);
				clearInterval(_interval);
				_interval = setInterval(positionInterval, 100);
			}
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
			if(_stage) {
				_stage.attachNetStream(_stream);
			} else {
				_video.attachNetStream(_stream);
			}
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
					if(_type == 'mp3') {
						_connection.call("getStreamLength", new Responder(streamlengthHandler), _id);
					}
					//	Do live stream subscription, for Edgecast/Limelight.
					if (getConfigProperty('subscribe')) {
						_connection.call("FCSubscribe", null, _id);
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
					error("Error loading stream: ID not found on server");
					break;
				// This event gets send when a live encoder is stopped.
				case 'NetStream.Play.UnpublishNotify':
					stop();
					sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_COMPLETE);
					break;
				// Wowza automatically closes connection after a timeout
				case 'NetConnection.Connect.Closed':
					if(state == PlayerState.PAUSED) {
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
			_levels = [];
			_application = _id = _type = undefined;
			_metadata = false;
			_connection.close();
			clearInterval(_interval);
			_position = 0;
			super.stop();
		}


		/** Get the streamlength returned from the connection. **/
		private function streamlengthHandler(length:Number):void {
			_metadata = true;
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


    }
}