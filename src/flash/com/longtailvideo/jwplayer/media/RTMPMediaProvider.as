/**
 * Wrapper for playback of _video streamed over RTMP.
 **/
package com.longtailvideo.jwplayer.media {
    import com.longtailvideo.jwplayer.events.MediaEvent;
    import com.longtailvideo.jwplayer.events.PlayerEvent;
    import com.longtailvideo.jwplayer.model.PlayerConfig;
    import com.longtailvideo.jwplayer.model.PlaylistItem;
    import com.longtailvideo.jwplayer.model.PlaylistItemLevel;
    import com.longtailvideo.jwplayer.parsers.LoadbalanceParser;
    import com.longtailvideo.jwplayer.player.PlayerState;
    import com.longtailvideo.jwplayer.utils.AssetLoader;
    import com.longtailvideo.jwplayer.utils.Configger;
    import com.longtailvideo.jwplayer.utils.Logger;
    import com.longtailvideo.jwplayer.utils.NetClient;
    import com.longtailvideo.jwplayer.utils.Strings;
    import com.wowza.encryptionAS3.TEA;
    
    import flash.events.*;
    import flash.media.*;
    import flash.net.*;
    import flash.utils.*;

    /**
     * Wrapper for playback of video streamed over RTMP. Can playback MP4, FLV, MP3, AAC and live streams.
     **/
    public class RTMPMediaProvider extends MediaProvider {
		/** Save if the bandwidth checkin already occurs. **/
		private var _bandwidthChecked:Boolean;
		/** Whether to connect to a stream when bandwidth is detected. **/
		private var _bandwidthSwitch:Boolean;
		/** Save that we're connected to either the tunneled or untunneled connection. **/
		private var _connection:NetConnection;
		/** Save that we received any response from the untunneled connection. **/
		private var _responded:Boolean;
        /** Is dynamic streaming possible. **/
        private var _dynamic:Boolean;
		/** The currently playing RTMP stream. **/
		private var _currentFile:String;
        /** ID for the position interval. **/
        private var _positionInterval:Number;
        /** Loaders for loading SMIL files. **/
        private var _xmlLoaders:Dictionary;
        /** NetStream instance that handles the stream IO. **/
        private var _stream:NetStream;
        /** Number of subcription attempts. **/
        private var _subscribeCount:Number = 0;
        /** Interval ID for subscription pings. **/
        private var _subscribeInterval:Number;
        /** Offset in seconds of the last seek. **/
        private var _timeoffset:Number = -1;
        /** Sound control object. **/
        private var _transformer:SoundTransform;
        /** Save that a stream is streaming. **/
        private var _isStreaming:Boolean;
        /** Level to which we're transitioning. **/
        private var _transitionLevel:Number = -1;
        /** Video object to be instantiated. **/
        private var _video:Video;
		/** Whether or not the buffer is full **/
		private var _bufferFull:Boolean = false;
		/** Duration of the DVR stream at the time the client connects. **/
		private var _dvrStartDuration:Number = 0;
		/** Is the DVR stream currently recording? **/
		private var _dvrStartDate:Number = 0;
		/** Whether we should pause the stream when we first connect to it **/
		private var	_lockOnStream:Boolean = false;
		/** Do we need to request loadbalance SMILs on switch. **/
		private var _loadbalanceOnSwitch:Boolean;
		/** Number of frames dropped at present. **/
		private var _streamInfo:Array;
		/** Interval for bw checking - with dynamic streaming. **/
		private var _streamInfoInterval:Number;
		/** Set if the duration comes from the configuration **/ 
		private var _userDuration:Boolean;

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
			_xmlLoaders = new Dictionary();
            _transformer = new SoundTransform();
            _video = new Video(320, 240);
            _video.smoothing = config.smoothing;
        }

        /** Check if the player can use dynamic streaming (server versions and no load balancing). **/
        private function checkDynamic(str:String):void {
            var clt:Number = Number((new PlayerEvent('')).client.split(' ')[2].split(',')[0]);
            var mjr:Number = Number(str.split(',')[0]);
            var mnr:Number = Number(str.split(',')[1]);
            if (clt > 9 && (mjr > 3 || (mjr == 3 && mnr > 4))) {
                _dynamic = true;
            } else {
                _dynamic = false;
            }
        }


		/** Connect to a tunneled connection in case the firewall blocks 1935 or RTMP. **/
		private function connectTunneled():void {
		    // Only attempt a connect if the server didn't respond at all.
		    if(_responded) {
		        return;
		    }
		    var streamer:String = item.streamer;
		    // First switch to a tunneling protocol ONLY if not tunneled.
			if(streamer.substr(0,7) == 'rtmp://') {
				streamer = streamer.replace('rtmp://','rtmpt://');
			} else if(streamer.substr(0,8) == 'rtmpe://') {
				streamer = streamer.replace('rtmpe://','rtmpte://');
			} else {
			    return;
			}
			// Next hard-code port 80, stripping out any existing port designation.
			var slash:Number = streamer.indexOf('/',10);
			var colon:Number = streamer.indexOf(':',10);
			if(colon > -1 && colon < slash) {
			    streamer = streamer.substr(0,colon) + ':80' + streamer.substr(slash);
			} else {
			    streamer = streamer.substr(0,slash) + ':80' + streamer.substr(slash);
			}
			// When all done, connect to the tunneled streamer.
		    Logger.log("Fallback to tunneled connection: "+streamer);
		    item.streamer = streamer;
			_connection.connect(item.streamer);
		};


		/** Try pulling info from a DVRCast application. **/
		private function doDVRInfo(id:String):void {
			_connection.call("DVRGetStreamInfo", new Responder(doDVRInfoCallback), id);
		};


		/** Callback from the DVRCast application. **/
		private function doDVRInfoCallback(info:Object):void {
			_subscribeCount++;
			if(info.code == "NetStream.DVRStreamInfo.Success") {
				if(info.data.currLen < 10) {
					setTimeout(doDVRInfo,4000,getID(item.file))
				} else { 
					_dvrStartDuration = info.data.currLen - 20;
					if(info.data.isRec) {
						_dvrStartDate = new Date().valueOf();
						if(_dvrStartDuration > 20) {
							_timeoffset = _dvrStartDuration - 10;
						}
					}
					setStream();
				}
			} else if (info.code == "NetStream.DVRStreamInfo.Retry") {
				if(_subscribeCount > 3) {
					clearInterval(_subscribeInterval);
					stop();
					sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_ERROR, 
						{message: "Subscribing to the dvr stream timed out."});
				} else { 
					setTimeout(doDVRInfo,2000,getID(item.file));
				}
			}
			for (var itm:String in info.data) { 
				info[itm] = info.data[itm];
			}
			delete info.data;
			sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_META, {metadata: info});
		};


	/** Try subscribing to livestream **/
		private function doSubscribe():void {
			_subscribeCount++;
			if(_subscribeCount > 3) {
				clearInterval(_subscribeInterval);
				stop();
				sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_ERROR, 
					{message: "Subscribing to the live stream timed out."});
			} else if(item.levels && item.levels.length > 1) { 
			    for(var i:Number=0; i<item.levels.length; i++) { 
				    _connection.call("FCSubscribe", null, getID(item.levels[i].file));
			    }
			} else {
				_connection.call("FCSubscribe", null, getID(item.file));
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
				var drf:Number = _stream.info.droppedFrames;
				var stt:String = state;
				_streamInfo.push({bwd:bwd,drf:drf,stt:stt});
				var len:Number = _streamInfo.length;
				if(len > 5 && state == PlayerState.PLAYING) {
					bwd = Math.round((_streamInfo[len-1].bwd + _streamInfo[len-2].bwd + _streamInfo[len-3].bwd + 
						_streamInfo[len-4].bwd+ + _streamInfo[len-5].bwd)/5);
					config.bandwidth = bwd;
					Configger.saveCookie('bandwidth',bwd);
					// Don't trust framedrops when player buffered during last samplings.
					if(_streamInfo[len-2].stt==PlayerState.BUFFERING ||
						_streamInfo[len-3].stt==PlayerState.BUFFERING) {
						drf = 0;
					} else {
						drf = Math.round((_streamInfo[len-1].drf - _streamInfo[len-3].drf)*5)/10;
					}
					if(item.levels.length > 0 && item.getLevel(bwd,config.width) != item.currentLevel) {
						Logger.log("swapping to another level b/c of bandwidth",bwd.toString());
						swap(item.getLevel(bwd, config.width));
					}
					if(item.levels.length > 0 && drf > 10 && item.currentLevel < item.levels.length-1) {
						var lvl:Number = item.currentLevel;
						item.blacklistLevel(lvl);
						setTimeout(unBlacklist,30000,lvl);
						sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_META, {metadata: {type:'blacklist',level:lvl,state:true}});
						Logger.log("swapping to another level b/c of framedrops",drf.toString());
						swap(item.getLevel(bwd, config.width));
					}
					sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_META, {metadata: {bandwidth:bwd,droppedFrames:drf}});
				}
			} catch(e:Error) {
				Logger.log("There was an error attempting to get stream info: " + e.message);
			}
		};


		private function unBlacklist(level:Number):void {
			item.blacklistLevel(level,false);
			sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_META, {metadata: {type:'blacklist',level:level,state:false}});
		};


        /** Extract the correct rtmp syntax from the file string. **/
        private function getID(url:String):String {
			var parts:Array = url.split("?");
            var ext:String = parts[0].substr(-4);
			parts[0] = parts[0].substr(0, parts[0].length-4);
            if (url.indexOf(':') > -1) {
                return url;
            } else if (ext == '.mp3') {
                return 'mp3:' + parts.join("?");
            } else if (ext == '.mp4' || ext == '.mov' || ext == '.m4v' || ext == '.aac' || ext == '.m4a' || ext == '.f4v') {
                return 'mp4:' + url;
            } else if (ext == '.flv') {
                return parts.join("?");
            } else {
                return url;
            }
        }

        /** Load content. **/
        override public function load(itm:PlaylistItem):void {
            _item = itm;
            _position = 0;
			_bufferFull = false;
			_bandwidthSwitch = false;
			_lockOnStream = false;
			_userDuration = (_item.duration > 0);
			
			if (_timeoffset < 0) {
            	_timeoffset = item.start;
			}
			
			if (item.levels.length > 0) { item.setLevel(item.getLevel(config.bandwidth, config.width)); }
			
			clearInterval(_positionInterval);
			
			if (getConfigProperty('loadbalance')) {
				loadSmil();
			} else {
				finishLoad();
			}
			
			setState(PlayerState.BUFFERING);
			sendBufferEvent(0);
        }

		/** Load a SMIL file for load-balancing **/
		private function loadSmil():void {
			if (!item.hasOwnProperty('smil')) { 
				item.smil = [];				
				if (item.levels.length > 0) {
					for (var i:Number = 0; i < item.levels.length; i++) {
						item.smil[i] = (item.levels[i] as PlaylistItemLevel).file;
					}
				} else {
					item.smil[0] = item.file;
				}
			} 
			
			var smilFile:String = item.levels.length > 0 ? item.smil[item.currentLevel] : item.smil[0];
			
			var loader:AssetLoader = new AssetLoader();
			loader.addEventListener(Event.COMPLETE, loaderHandler);
			loader.addEventListener(ErrorEvent.ERROR, errorHandler);
			_xmlLoaders[loader] = smilFile;
			loader.load(smilFile, XML);
		}
		
		/** Finalizes the loading process **/
		private function finishLoad():void {
			var ext:String = Strings.extension(item.file);
			if (ext == 'mp3' || item.file.substr(0,4) == 'mp3:' || ext == 'aac' || ext == 'm4a') {
				media = null;
			} else if (!media) {
				media = _video;
			}
			sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_LOADED);
			try {
			    _responded = false;
				_connection.connect(item.streamer);
				if(getConfigProperty("tunneling") !== false) {
					setTimeout(connectTunneled,5000);
			    }
			} catch(e:Error) {
				error("Could not connect to application: " + e.message);
			}
		}


		/** Get one or more levels from the loadbalancing XML. **/
		private function loaderHandler(evt:Event):void {
			var arr:Array = LoadbalanceParser.parse((evt.target as AssetLoader).loadedObject);
			var smilLocation:String = _xmlLoaders[evt.target];
			delete _xmlLoaders[evt.target];
			if(arr.length > 1) {
				item.clearLevels()
				for(var i:Number=0; i<arr.length; i++) { item.addLevel(arr[i]); }
				item.setLevel(item.getLevel(config.bandwidth, config.width));
			} else if (item.levels.length > 0) {
				var level:PlaylistItemLevel = item.levels[(item.smil as Array).indexOf(smilLocation)] as PlaylistItemLevel;
				level.streamer = arr[0].streamer;
				level.file = arr[0].file;
				_loadbalanceOnSwitch = true;
			} else {
				item.streamer = arr[0].streamer;
				item.file = arr[0].file;
			}
			finishLoad();
		};


        /** Get metadata information from netstream class. **/
        public function onClientData(dat:Object):void {
			if (!dat) return;
            if (dat.type == 'fcsubscribe') {
                if (dat.code == "NetStream.Play.StreamNotFound") {
					sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_ERROR,{message: "Subscription failed: " + item.file});
                } else if (dat.code == "NetStream.Play.Start" && !_stream) {
					setStream();
                }
                clearInterval(_subscribeInterval);
            }
            if (dat.width) {
				_video.width = dat.width;
				_video.height = dat.height;
				super.resize(_width, _height);
            }
			if (dat.code == 'NetStream.Play.TransitionComplete') {
				if (_transitionLevel >= 0) { _transitionLevel = -1; }
			} else if (dat.type == "metadata") {
				if (dat.duration && !_userDuration) {
					item.duration = dat.duration;
				}
			}
            if (dat.type == 'complete') {
                clearInterval(_positionInterval);
				complete();
            }
            if (dat.type == 'close') {
                stop();
            }
            if (dat.type == 'bandwidth') {
                config.bandwidth = dat.bandwidth;
                Configger.saveCookie('bandwidth', dat.bandwidth);
				if (_bandwidthSwitch) {
					_bandwidthSwitch = false;
                	setStream();
				}
            }
			sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_META, {metadata: dat});
        }


        /** Pause playback. **/
        override public function pause():void {
            super.pause();
            if (_stream) {
                if (isLivestream) {
                    _stream.close();
                } else { 
                    _stream.pause();
                }
            } else {
                _lockOnStream = true;
            }
        };


        /** Resume playing. **/
        override public function play():void {
			if (_lockOnStream) {
				_lockOnStream = false;
				if (_stream) {
					seek(_timeoffset);
				} else {
					setStream();
				}
			} else if (state == PlayerState.PAUSED) {
			    if (isLivestream) {
					_stream.play(getID(item.file),-1);
		        } else { 
				    _stream.resume();
	            }
			}
			super.play();
			clearInterval(_positionInterval);
			_positionInterval = setInterval(positionInterval, 100);
        }

        /** Interval for the position progress. **/
        private function positionInterval():void {
            var pos:Number = Math.round((_stream.time) * 100) / 100;
			var bfr:Number = _stream.bufferLength / _stream.bufferTime;

			if (bfr < 0.25 && pos < duration - 5 && state != PlayerState.BUFFERING) {
				_bufferFull = false;
				setState(PlayerState.BUFFERING);
            } else if (bfr > 1 && state != PlayerState.PLAYING && !_bufferFull && !isLivestream) {
				_bufferFull = true;
				sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_BUFFER_FULL, {bufferPercent: bfr});
            }
			
            if (!getConfigProperty('dvr') && state != PlayerState.PLAYING) {
                return;
            }
            if (pos < duration) {
				_position = pos;
				sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_TIME, {position: position, duration: duration});
            } else if (position > 0 && duration > 0) {
                _stream.pause();
                clearInterval(_positionInterval);
				complete();
            }
        }


        /** Check if the level must be switched on resize. **/
        override public function resize(width:Number, height:Number):void {
            super.resize(width, height);
			if (state == PlayerState.PLAYING) {
            	if (item.levels.length > 0 && item.currentLevel != item.getLevel(config.bandwidth, config.width)) {
                	if (_dynamic) {
						Logger.log("swapping to another level b/c of size: "+config.width);
	                    swap(item.getLevel(config.bandwidth, config.width));
                	} else {
	                    seek(position);
                	}
				}
            }
        }


        /** Seek to a new position. **/
		override public function seek(pos:Number):void {
			_transitionLevel = -1;
			if(getConfigProperty('dvr') && _dvrStartDate && pos > duration - 10) { 
				pos = duration - 10;
			}
			_timeoffset = pos;
            clearInterval(_positionInterval);
			if (item.levels.length > 0 && item.getLevel(config.bandwidth, config.width) != item.currentLevel) {
                item.setLevel(item.getLevel(config.bandwidth, config.width));
                if (_loadbalanceOnSwitch) {
                    load(item);
                    return;
                }
            }
			
			if (state == PlayerState.PAUSED) {
				play();
			}

			if (_currentFile != item.file) {
				_currentFile = item.file;
				try {
					if(_dvrStartDate) {
						_stream.play(getID(item.file),10);
						Logger.log("dvring "+item.file,"rtmp");
					} else {
						_stream.play(getID(item.file));
						if (_dynamic) {
							_streamInfo = new Array();
							clearInterval(_streamInfoInterval);
							_streamInfoInterval = setInterval(getStreamInfo, 1000);
						}
					}
				} catch(e:Error) {
					Logger.log("Error: " + e.message);
				}
			}
			if ((_timeoffset > 0 || _position > _timeoffset || state == PlayerState.IDLE)) {
				_bufferFull = false;
				setState(PlayerState.BUFFERING);
				_stream.seek(_timeoffset);
			}
			_isStreaming = true;
			clearInterval(_positionInterval);
			_positionInterval = setInterval(positionInterval, 100);
		}


		/** Start the netstream object. **/
		private function setStream():void {
			_stream = new NetStream(_connection);
			_stream.checkPolicyFile = true;
			_stream.addEventListener(NetStatusEvent.NET_STATUS, statusHandler);
			_stream.addEventListener(IOErrorEvent.IO_ERROR, errorHandler);
			_stream.addEventListener(AsyncErrorEvent.ASYNC_ERROR, errorHandler);
			if(getConfigProperty('dvr') || getConfigProperty('subscribe') || _dynamic) {
				_stream.bufferTime = 4;
			} else { 
				_stream.bufferTime = config.bufferlength;
			}
			_stream.client = new NetClient(this);
			_video.attachNetStream(_stream);
			streamVolume(config.mute ? 0 : config.volume);
			if (!_lockOnStream) {
				seek(_timeoffset);
			}
		};


        /** Receive NetStream status updates. **/
        private function statusHandler(evt:NetStatusEvent):void {
            _responded = true;
            switch (evt.info.code) {
                case 'NetConnection.Connect.Success':
                    if (evt.info.secureToken != undefined) {
                        _connection.call("secureTokenResponse", null, 
                            TEA.decrypt(evt.info.secureToken,config.token));
                    }
                    if (evt.info.data) {
                        checkDynamic(evt.info.data.version);
					}
					if(getConfigProperty('dvr')) {
						_connection.call("DVRSubscribe", null, getID(item.file));
						setTimeout(doDVRInfo,2000,getID(item.file));
					} else if (getConfigProperty('subscribe')) {
						_subscribeInterval = setInterval(doSubscribe, 2000);
					} else {
                        if (item.levels.length > 0) {
                            if (_dynamic || _bandwidthChecked) {
                                setStream();
                            } else {
								_bandwidthChecked = true;
								_bandwidthSwitch = true;
                                _connection.call('checkBandwidth', null);
                            }
                        } else {
                            setStream();
                        }
                        _connection.call("getStreamLength", new Responder(streamlengthHandler), getID(item.file));
                    }
                    break;
                case 'NetStream.Seek.Notify':
                    clearInterval(_positionInterval);
					_positionInterval = setInterval(positionInterval, 100);
                    break;
                case 'NetConnection.Connect.Rejected':
                    try {
                        if (evt.info.ex.code == 302) {
                            item.streamer = evt.info.ex.redirect;
                            setTimeout(load, 100, item);
                            return;
                        }
                    } catch (err:Error) {
                        stop();
                        var msg:String = evt.info.code;
                        if (evt.info['description']) {
                            msg = evt.info['description'];
                        }
                        stop();
						sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_ERROR, {message: msg}); 
                    }
                    break;
				case 'NetStream.Failed':
                case 'NetStream.Play.StreamNotFound':
                    if (!_isStreaming) {
                        onClientData({type: 'complete'});
                    } else {
                        stop();
						sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_ERROR, {message: "Stream not found: " + item.file});
                    }
                    break;
				case 'NetStream.Seek.Failed':
					if (!_isStreaming) {
						onClientData({type: 'complete'});
					} else {
						stop();
						sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_ERROR, {message: "Could not seek: " + item.file});
					}
					break;
				case 'NetConnection.Connect.Closed':
					stop();
					break;
				case 'NetConnection.Connect.Failed':
					if(item.streamer.substr(0,5) == 'rtmpt') { 
						stop();
						sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_ERROR, {message: "Server not found: " + item.streamer});
					} else { 
						_responded = false;
					}
					break;
                case 'NetStream.Play.UnpublishNotify':
                    stop();
                    break;
				case 'NetStream.Buffer.Full':
					if (!_bufferFull) {
						_bufferFull = true;
						sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_BUFFER_FULL);
					}
					break;
				case 'NetStream.Play.Transition':
					onClientData(evt.info);
					break;
				case 'NetStream.Play.Stop':
					if(getConfigProperty('dvr')) { stop(); }
					break;
					
            }
			sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_META, {metadata: evt.info});
        }


		/** Destroy the stream. **/
		override public function stop():void {
			if (_stream && _stream.time) {
				_stream.close();
			}
			_stream = null;
			_isStreaming =  false;
			_currentFile = undefined;
			_video.clear();
			_connection.close();
			clearInterval(_positionInterval);
			_position = 0;
			_timeoffset = -1;
			_dvrStartDuration = _dvrStartDate = _subscribeCount = 0;
			_streamInfo = new Array();
			clearInterval(_streamInfoInterval);
			super.stop();
			if (item && item.hasOwnProperty('smil')) {
				/** Replace file values with original redirects **/
				if (item.levels.length > 0) {
					for each (var level:PlaylistItemLevel in item.levels) { 
						for (var i:Number = 0; i < (item.smil as Array).length; i++) {
							level.file = item.smil[i];
						}
					}
				} else {
					item.file = item.smil[0];
				}
			}
		}


		/** Get the streamlength returned from the connection. **/
		private function streamlengthHandler(len:Number):void {
			if(len && !_userDuration) {
				item.duration = len;
				sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_META, {metadata:{duration:len}});
			}
		}


		/** Dynamically switch streams **/
		private function swap(newLevel:Number):void {
			if (_transitionLevel == -1 && (newLevel < item.currentLevel || 
				_stream.bufferLength < _stream.bufferTime * 1.5 || item.levels[item.currentLevel].blacklisted)) {
				_transitionLevel = newLevel;
				item.setLevel(newLevel);
				var nso:NetStreamPlayOptions = new NetStreamPlayOptions();
				nso.streamName = getID(item.file);
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


		/** Completes video playback **/
		override protected function complete():void {
			stop();
			sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_COMPLETE);
		}


		/** Determines if the stream is a live stream **/
		protected function get isLivestream():Boolean {
			// We assume it's a livestream until we hear otherwise.
			return (!(duration > 0) && _stream);
		}


		protected function get duration():Number {
			if(getConfigProperty('dvr')) {
				var dur:Number = _dvrStartDuration;
				if(_dvrStartDate) { 
					dur += (new Date().valueOf() - _dvrStartDate) / 1000;
				}
				return Math.round(dur);
			} else { 
				return item.duration;
			}
		}
		
    }
}