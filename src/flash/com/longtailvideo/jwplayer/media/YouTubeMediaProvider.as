package com.longtailvideo.jwplayer.media {
	import com.longtailvideo.jwplayer.events.MediaEvent;
	import com.longtailvideo.jwplayer.model.PlayerConfig;
	import com.longtailvideo.jwplayer.model.PlaylistItem;
	import com.longtailvideo.jwplayer.player.PlayerState;
	import com.longtailvideo.jwplayer.plugins.PluginConfig;
	
	import flash.display.Loader;
	import flash.events.ErrorEvent;
	import flash.events.Event;
	import flash.events.IOErrorEvent;
	import flash.events.StatusEvent;
	import flash.events.TimerEvent;
	import flash.net.URLRequest;
	import flash.utils.Timer;


	/**
	 * Wrapper for playback of YouTube videos through the YT Cromeless Player.
	 **/
	public class YouTubeMediaProvider extends MediaProvider {
		/** Loader used to load YouTube chromeless API swf **/
		private var _loader:Loader;
		/** Location of chromeless API **/
		private var _ytApiUrl:String = "http://www.youtube.com/apiplayer?version=3&modestbranding=1";
		/** YouTube chromeless player API **/
		private var _ytAPI:Object;
		/** Whether or not to play the item once the chromeless API has been loaded **/
		private var _loading:Boolean = false;
		/** Whether or not the chromeless API is ready **/
		private var _ready:Boolean = false;
		/** Timer used to update YouTube playback status **/
		private var _statusTimer:Timer;
		/** Seek offset **/
		private var _offset:Number = 0;
		/** YouTube video id for the current item **/
		private var _videoId:String = "";
		/** Array of YouTube quality levels **/
		private var _qualityLevels:Array;
		/** Bytes loaded for currently loading segment **/
		private var bytesLodaed:Number;
		/** Bytes total for currently loading segment **/
		private var bytesTotal:Number;
		/** Current bytes offset from beginning of stream **/
		private var bytesOffset:Number;


		/** Setup YouTube connections and load proxy. **/
		public function YouTubeMediaProvider() {
			super('youtube');
			this.stretch = false;
			_statusTimer = new Timer(100);
			_statusTimer.addEventListener(TimerEvent.TIMER, updatePlaybackStatus);
			_loader = new Loader();
			_loader.contentLoaderInfo.addEventListener(Event.COMPLETE, apiLoaded);
			_loader.contentLoaderInfo.addEventListener(IOErrorEvent.IO_ERROR, loadErrorHandler);
		}


		/** Catch load errors. **/
		private function loadErrorHandler(evt:ErrorEvent):void {
			error(evt.text);
		}


		/** Extract the current ID from a youtube URL.  Supported values include:
		 * http://www.youtube.com/watch?v=ylLzyHk54Z0
		 * http://www.youtube.com/watch#!v=ylLzyHk54Z0
		 * http://www.youtube.com/v/ylLzyHk54Z0
		 * http://youtu.be/ylLzyHk54Z0
		 * ylLzyHk54Z0
		 **/
		public static function getID(url:String):String {
			var arr:Array = url.split(/\?|\#\!/);
			var str:String = '';
			for (var i:String in arr) {
				if (arr[i].substr(0, 2) == 'v=') {
					str = arr[i].substr(2);
				}
			}
			if (str == '') {
				if (url.indexOf('/v/') >= 0) {
					str = url.substr(url.indexOf('/v/') + 3);
				} else if (url.indexOf('youtu.be') >= 0) {
					str = url.substr(url.indexOf('youtu.be/') + 9);
				} else {
					str = url;
				}
			}
			if (str.indexOf('?') > -1) {
				str = str.substr(0, str.indexOf('?'));
			}
			if (str.indexOf('&') > -1) {
				str = str.substr(0, str.indexOf('&'));
			}
			return str;
		}


		/** Load the YouTube movie. **/
		public override function load(itm:PlaylistItem):void {
			bytesLodaed = bytesTotal = bytesOffset = _offset = 0;
			_item = itm;
			_qualityLevels = null;
			_currentQuality = 0;
			_videoId = getID(_item.file);
			_position = _offset = 0;
			setState(PlayerState.BUFFERING);
			sendBufferEvent(0);
			sendQualityEvent(MediaEvent.JWPLAYER_MEDIA_LEVELS, [], -1);
			if (_ready) {
				// Chromeless API has already been loaded
				completeLoad(itm);
			} else {
				_loading = true;
				_loader.load(new URLRequest(_ytApiUrl));
			}
		}


		/** SWF loaded; add it to the tree **/
		private function apiLoaded(evt:Event):void {
			_ytAPI = _loader.content;
			_ytAPI.addEventListener("onReady", apiReady);
			_ytAPI.addEventListener("onError", onPlayerError);
			_ytAPI.addEventListener("onStateChange", onStateChange);
			_ytAPI.addEventListener("onPlaybackQualityChange", onPlaybackQualityChange);
		}


		/** API initialized; resize it and wrap code. **/
		private function apiReady(evt:Event):void {
			_ready = true;
			var dispConf:PluginConfig = config.pluginConfig("display");
			resize(dispConf.width, dispConf.height);
			if (_loading) {
				_loading = false;
				completeLoad(_item);
			}
		}


		/** Catch YouTube API errors. **/
		private function onPlayerError(evt:Event):void {
			var errorCode:Number = Number(Object(evt).data);
			if (!isNaN(errorCode)) {
				switch (errorCode) {
					case 2:
						error("Error loading YouTube: Video ID is invalid");
						break;
					case 100:
						error("Error loading YouTube: Video removed or private");
						break;
					case 101:
					case 150:
						error("Error loading YouTube: Embedding not allowed");
						break;
				}
			} else {
				error("Error loading YouTube: API connection error");
			}
			
		}


		/** Everything loaded - play the video **/
		private function completeLoad(itm:PlaylistItem):void {
			_ytAPI.cueVideoById(_videoId, _item.start, "default");
			_currentQuality = 0;
			media = _loader;
			sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_LOADED);
			sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_BUFFER_FULL);
			setVolume(config.mute ? 0 : config.volume);
			_statusTimer.start();
		}


		/** Catch youtube state changes. **/
		public function onStateChange(evt:Event):void {
			switch (Number(Object(evt).data)) {
				case 0:
					// "ended"
					if (state != PlayerState.BUFFERING && state != PlayerState.IDLE) {
						complete();
						_offset = 0;
					}
					break;
				case 1:
					// "playing"
					super.play();
					break;
				case 2:
					// "paused"
					super.pause();
					break;
				case 3:
					// "buffering"
					setState(PlayerState.BUFFERING);
					break;
			}
		}


		/** Update playback status from YouTube API **/
		private function updatePlaybackStatus(evt:TimerEvent):void {
			bytesLodaed = _ytAPI.getVideoBytesLoaded();
			bytesTotal = _ytAPI.getVideoBytesTotal();
			bytesOffset = _ytAPI.getVideoStartBytes();
			_item.duration = _ytAPI.getDuration();
			// Send out bytes loaded.
			if (bytesTotal > 0) {
				if (item.duration > 0) {
					_offset = (bytesOffset / (bytesOffset + bytesTotal)) * _item.duration;
				}
				sendBufferEvent(100 * (bytesLodaed / (bytesOffset + bytesTotal)), _offset, {loaded:bytesLodaed, total:bytesTotal});
			}
			// Send out time ticks.
			if (state == PlayerState.PLAYING) {
				_position = _ytAPI.getCurrentTime();
				sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_TIME, {position: _position, duration: _item.duration, offset: _offset});
			}
			// Fetch quality levels from YT player.
			if (!_qualityLevels || _qualityLevels.length == 0) {
				var levels:Array = _ytAPI.getAvailableQualityLevels();
				if (levels && levels.length > 0) {
					_qualityLevels = [];
					for each (var level:String in levels) {
						_qualityLevels.push({label:level});
					}
					if (_qualityLevels.length > 1) {
						_qualityLevels.unshift({label: "auto"});
						// sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_META, { metadata: { youtubequalitylevels: _qualityLevels } });
						if (_currentQuality > 0) {
							currentQuality = _currentQuality;
						}
					}
					sendQualityEvent(MediaEvent.JWPLAYER_MEDIA_LEVELS, _qualityLevels, _currentQuality);
				}
			}
		}


		/** Pause the YouTube movie. **/
		public override function pause():void {
			if (state == PlayerState.PLAYING || state == PlayerState.BUFFERING) {
				if (_ready) {
					_ytAPI.pauseVideo();
				}
				super.pause();
			}
		}


		/** Play or pause the video. **/
		public override function play():void {
			if (_ready) {
				_ytAPI.playVideo();
				//super.play();
			}
		}


		/** Resize the YT player. **/
		public override function resize(wid:Number, hei:Number):void {
			if (_ready) {
				_ytAPI.setSize(wid, hei);
			}
		}


		/** Seek to _position. **/
		override public function seek(pos:Number):void {
			if (_ready) {
				/*
				if ( ( pos < _offset ) || 
					 ( (_offset / item.duration) > ( (bytesLodaed + bytesOffset) / bytesTotal) ) 
				) { 
					sendBufferEvent(0, pos);
					setState(PlayerState.BUFFERING);
				}
				*/
				_ytAPI.seekTo(pos, true);
				_offset = pos;
				super.seek(pos);
				play();
			}
		}


		/** Destroy the youtube video. **/
		override public function stop():void {
			if (_ready) {
				if (_ytAPI.getPlayerState() > 0) {
					// YouTube API is in playing (1), paused (2), buffering (3) or cued (5) state.
					_ytAPI.stopVideo();
				}
			}
			_statusTimer.stop();
			_position = _offset = 0;
			super.stop();
		}


		/** Set the volume level. **/
		override public function setVolume(pct:Number):void {
			if (_ready) {
				_ytAPI.setVolume(Math.min(Math.max(0, pct), 100));
			}
			super.setVolume(pct);
		}


		/** Return the list of quality levels. **/
		override public function get qualityLevels():Array {
			return _qualityLevels;
		}


		/** Change the current quality. **/
		override public function set currentQuality(quality:Number):void {
			if (quality > 0) {
				_currentQuality = quality;
				if (_qualityLevels && quality < _qualityLevels.length) {
					_ytAPI.setPlaybackQuality(_qualityLevels[quality].label);
				}
			} else {
				_currentQuality = 0;
				_ytAPI.setPlaybackQuality("default");
			}
		}


		/** Propagate quality changes from the API. **/
		private function onPlaybackQualityChange(event:Event):void {
			if (_currentQuality > 0) {
				for (var i:Number = 0; i < _qualityLevels.length; i++) {
					if (_qualityLevels[i].label == Object(event).data) {
						_currentQuality = i;
						sendQualityEvent(MediaEvent.JWPLAYER_MEDIA_LEVEL_CHANGED, _qualityLevels, _currentQuality);
						return;
					}
				}
			}
		}


	}
}