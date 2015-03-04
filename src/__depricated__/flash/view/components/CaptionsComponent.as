package com.longtailvideo.jwplayer.view.components {
	
	import com.longtailvideo.jwplayer.events.CaptionsEvent;
	import com.longtailvideo.jwplayer.events.MediaEvent;
	import com.longtailvideo.jwplayer.events.PlayerStateEvent;
	import com.longtailvideo.jwplayer.events.PlaylistEvent;
    import com.longtailvideo.jwplayer.events.CaptionsParsedEvent;
    import com.longtailvideo.jwplayer.parsers.DFXP;
    import com.longtailvideo.jwplayer.events.TrackEvent;
	import com.longtailvideo.jwplayer.parsers.ISO639;
	import com.longtailvideo.jwplayer.parsers.SRT;
	import com.longtailvideo.jwplayer.player.IPlayer;
	import com.longtailvideo.jwplayer.player.PlayerState;
	import com.longtailvideo.jwplayer.utils.Configger;
	import com.longtailvideo.jwplayer.utils.Logger;
	import com.longtailvideo.jwplayer.view.interfaces.IPlayerComponent;
	
	import flash.display.Sprite;
	import flash.events.ErrorEvent;
	import flash.events.Event;
	import flash.events.IOErrorEvent;
	import flash.events.SecurityErrorEvent;
	import flash.net.URLLoader;
	import flash.net.URLRequest;
	
	
	/** Plugin for playing closed captions with a video. **/
	public class CaptionsComponent extends Sprite implements IPlayerComponent {

		/** Default style properties. **/
		private var _defaults:Object = {
			color: '#FFFFFF',
			fontSize: 15,
			fontFamily: 'Arial,sans-serif',
			fontOpacity: 100,
			edgeStyle: null
		};
		
		private var _background:Object = {
			back: true,
			backgroundColor: '#000000',
			backgroundOpacity: 100,
			windowColor: '#FFFFFF',
			windowOpacity: 0
		};
		
		private var _style:Object = {
			fontStyle: 'normal',
			fontWeight: 'normal',
			leading: 5,
			textAlign: 'center',
			textDecoration: 'none'
		};
		
		/** Currently active playlist item. **/
		private var _item:Object;
		/** XML connect and parse object. **/
		private var _loader:URLLoader;
		/* Reference to the JW Player. */
		private var _player:IPlayer;
		/** Reference to the captions renderer. **/
		private var _renderer:CaptionRenderer;
		/** Current player state. **/
		private var _state:String;
		/** Currently active track. **/
		private var _track:Number = 0;
		/** Current listing of tracks. **/
		private var _tracks:Array;
		/** Currently selected track index. **/
		private var _selectedTrack:Number;
		
		private var _streamTrack:Number = -1;

        private var _captionHashes:Object = {};
		
		/** Constructor; inits the parser, selector and renderer. **/
		public function CaptionsComponent(player:IPlayer) {

			_loader = new URLLoader();
			_loader.addEventListener(Event.COMPLETE, _loaderHandler);
			_loader.addEventListener(IOErrorEvent.IO_ERROR, _errorHandler);
			_loader.addEventListener(SecurityErrorEvent.SECURITY_ERROR, _errorHandler);
			_tracks = new Array();
			
			// Connect to the player API.
			_player = player;
			_player.addEventListener(PlaylistEvent.JWPLAYER_PLAYLIST_ITEM,_itemHandler);
			_player.addEventListener(MediaEvent.JWPLAYER_MEDIA_META,_metaHandler);
			_player.addEventListener(PlayerStateEvent.JWPLAYER_PLAYER_STATE,_stateHandler);
			_player.addEventListener(MediaEvent.JWPLAYER_MEDIA_TIME,_timeHandler);
            _player.addEventListener(TrackEvent.JWPLAYER_SUBTITLES_TRACKS, _subtitlesTracksHandler);
            _player.addEventListener(TrackEvent.JWPLAYER_SUBTITLES_TRACK_CHANGED, _subtitlesTrackChangedHandler);
            _player.addEventListener(CaptionsParsedEvent.CAPTIONS_PARSED, _captionsParsedEvent);
			
			var config:Object = _player.config.captions;
			
			_extend(_style, _defaults, config);
			_extend(_background, _background, config);
			
			// Fix for colors, since the player automatically converts to HEX.
			_style.color = _rgbHex(_style.color);
			
			_background.backgroundColor = _hexToUint(_rgbHex(_background.backgroundColor));
			_background.windowColor = _hexToUint(_rgbHex(_background.windowColor));
			if (_background.back === false) {
				_background.backgroundOpacity = 0;
			}
				
			// Place renderer and selector.
			_renderer = new CaptionRenderer(_style, _background);
			addChild(_renderer);
			_redraw();
		};
		
		private function _extend(target:Object, defaults:Object, options:Object):void {
			for (var rule:String in defaults) {
				var value:* = defaults[rule];
				if (options) {
					if (options[rule] != undefined) {
						value = options[rule];
					} else if (options[rule.toLowerCase()] != undefined) {
						value = options[rule.toLowerCase()];
					}
				}
				target[rule] = value;
			}
		}
		
		private function _rgbHex(color:*):String {
			var hex:String = String(color).replace('#','');
			if (hex.length === 3) {
				hex = hex.charAt(0)+hex.charAt(0)+hex.charAt(1)+hex.charAt(1)+hex.charAt(2)+hex.charAt(2);
			}
			return '#'+hex.substr(-6);
		};
		
		private function _hexToUint(hex:String):uint {
			return parseInt(hex.substr(-6), 16);
		}
		
		/** The captions loader returns errors (file not found or security error). **/
		private function _errorHandler(event:ErrorEvent):void {
			Logger.log(event.text);
		};

        /** Handle a list of subtitles tracks */
        private function _subtitlesTracksHandler(event:TrackEvent):void {
            if(event.type != TrackEvent.JWPLAYER_SUBTITLES_TRACKS) {
                throw new Error("wrong event");
            }

            if(event.tracks != null && event.tracks.length > 0) {
                // clear out sideloaded captions
                _resetTrackList();
                for(var i:int = 0; i < event.tracks.length; i++) {
                    var name:String = event.tracks[i].name;
                    _tracks.push({
                        data: [],
                        id: i,
                        label: name
                    });
                    _captionHashes[name] = {};
                }
                _initializeCaptions();
            }
        }

        /** Handle a subtitle track index change */
        private function _subtitlesTrackChangedHandler(event:TrackEvent):void {
            if (event.type != TrackEvent.JWPLAYER_SUBTITLES_TRACK_CHANGED) {
                throw new Error("wrong event");
            }

            _renderCaptions(event.currentTrack+1);
            _redraw();
        }

        /** Handle captions coming in from external sources **/
        private function _captionsParsedEvent(evt:CaptionsParsedEvent):void {
            var captions:Array = evt.captions;
            var name:String = evt.name;
            for(var i:int = 0; i < _tracks.length; i++) {
                if (_tracks[i].label == name) {

                    var track:Array = _tracks[i].data;

                    captions.sortOn("begin", Array.NUMERIC);

                    var currIdx:int = 0;

                    for each (var caption:Object in captions) {
                        if (caption.begin !== undefined) {
                            var hash:String = caption.text + caption.begin;
                            // Check if the same caption is already in the array
                            if (_captionHashes[name][hash] === undefined) {
                                for (var j:int = currIdx; j < track.length; j++) {
                                    if (track[j].begin > caption.begin) {
                                        if (j > 0 && track[j-1].end > caption.begin) {
                                            caption.begin = track[j-1].end = (track[j-1].end + caption.begin) / 2;
                                        }
                                        if (track[j].begin < caption.end) {
                                            track[j].begin = caption.end = (track[j].begin + caption.end) / 2;
                                        }
                                        currIdx = j;
                                        break;
                                    }
                                    if(j+1 == track.length) {
                                        currIdx = track.length;
                                    }
                                }
                                track.splice(currIdx, 0, caption);
                                _captionHashes[hash] = true;
                            }
                        }
                    }
                    _updateRenderer();
                    _redraw();
                }
            }
        }

        private function _resetTrackList():void {
            _track = 0;
            _selectedTrack = 0;
            _streamTrack = -1;
            _tracks = new Array();
            _renderer.setPosition(0);
            _captionHashes = {};
        }

		/** Check playlist item for captions. **/
		private function _itemHandler(event:PlaylistEvent):void {
            _resetTrackList();
			_item = _player.playlist.currentItem;
			if (_item)
				var tracks:Object = _item["tracks"];
			var caps:Array = [];
			for (var i:Number = 0; tracks && i < tracks.length; i++) {
				var kind:String = tracks[i].kind.toLowerCase();
				if (kind == "captions" || kind == "subtitles") {
					caps.push(tracks[i]);
				}
			}
			
			for (i = 0; i < caps.length; i++) {
				var entry:Object = caps[i];
				if (entry.file) {
					if (!entry.label) {
						entry.label = i.toString();
					}
					_tracks.push(entry);
				}
			}
			
			var defaultTrack:Number = 0;
			_selectedTrack = 0;
			
			for (i = 0; i < _tracks.length; i++) {
				if (_tracks[i]["default"]) {
					defaultTrack = i+1;
					break;
				}
			}
			
			if (_player.config.captionlabel) {
				tracks = _getTracks();
				for (i = 0; i < tracks.length; i++) {
					if (tracks[i].label == _player.config.captionlabel) {
						defaultTrack = i;
						break;
					}
				}
			}
			
			_renderCaptions(defaultTrack);
			_redraw();
			_sendEvent(CaptionsEvent.JWPLAYER_CAPTIONS_LIST, _getTracks(), _selectedTrack);
		};
		
		
		/** Parse and display external captions. **/
		private function _loaderHandler(event:Event):void {
			try {
				if(XML(event.target.data).localName().toString().toLowerCase() == DFXP.NAME) {
					_tracks[_track].data = DFXP.parseCaptions(XML(event.target.data),_defaults);
				} else {
					_tracks[_track].data = SRT.parseCaptions(String(event.target.data));
				}
			} catch (error:Error) {
				_tracks[_track].data = SRT.parseCaptions(String(event.target.data));
			}
			if (!_tracks[_track].data.length) {
				Logger.log('No captions entries found in file. Probably not a valid SRT or DFXP file?');
			} else {
				_renderer.setCaptions(_tracks[_track].data);
			}
			_redraw();
		};
		
		/** Handle captions which come in from a stream **/
		private function _streamCaptions(event:MediaEvent):void {
			if (_state == PlayerState.IDLE) { return; }
			if (event.metadata.type == "textdata") {
				if (!_tracks.length) {
					_tracks.push({
						data: undefined,
						file: undefined,
						id: 0,
						label: "On"
					});
					_initializeCaptions();
					_streamTrack = event.metadata.trackid;
					_renderer.setCaptions(event.metadata.text.replace(/\n$/,''));
				}
				else if (event.metadata.trackid == _streamTrack) {
					_renderer.setCaptions(event.metadata.text.replace(/\n$/,''));
				}
			}
		}
		
		
		/** Check for captions in metadata. **/
		private function _metaHandler(event:MediaEvent):void {
			if(_state == PlayerState.IDLE) { return; }
			if (event.metadata.provider == "rtmp" || event.metadata.provider == "hls") {
				_streamCaptions(event);
				return;
			}
			if(event.metadata.type == 'textdata') {
				if(_tracks.length) {
					if(event.metadata.trackid == _tracks[_track].id) {
						_renderer.setCaptions(event.metadata.text.replace(/\n$/,''));
					}
				} else {
					// For live streams (no trackinfo); presume only 1 track
					_tracks.push({
						data: undefined,
						file: undefined,
						id: event.metadata.trackid,
						label: 'captions'
					});
					_redraw();
					_renderer.setCaptions(event.metadata.text.replace(/\n$/,''));
				}
			} else if (event.metadata.trackinfo && _tracks.length == 0) {
				_metaTracks(event.metadata.trackinfo);
			}
		};
		
		
		/** Parse track info from MP4 metadata. **/
		private function _metaTracks(info:Object):void {
			for(var i:Number = 0; i < info.length; i++) {
				try {
					if(info[i].sampledescription[0].sampletype == 'tx3g') {
						_tracks.push({
							data: undefined,
							file: undefined,
							id: i,
							label: ISO639.label(info[i].language)
						});
					}
				} catch (e:Error) {}
			}
			_initializeCaptions();
		}
		
		private function _initializeCaptions():void {
			var defaultTrack:Number = 0;
			var tracks:Array = _getTracks();
			
			if (_player.config.captionlabel) {
				for (var i:Number = 0; i < tracks.length; i++) {
					if (tracks[i].label == _player.config.captionlabel) {
						defaultTrack = i;
						break;
					}
				}
			}
			
			_renderCaptions(defaultTrack);
			_redraw();
			_sendEvent(CaptionsEvent.JWPLAYER_CAPTIONS_LIST, tracks, _selectedTrack);
		}
		
		
		/** Show/hide the captions, update the button, save state in cookie. **/
		private function _redraw():void {
			if(!_tracks.length) {
				_renderer.visible = false;
			} 
			else {
				if(_state == PlayerState.IDLE) {
					_renderer.visible = false;
				} else if (_selectedTrack != 0) {
					_renderer.visible = true;
				}
				else {
					_renderer.visible = false;
				}
			}
		}
		
		
		/** Resize the captions, relatively smaller as the screen grows */
		public function resize(width:Number, height:Number):void {
			_renderer.scaleX = _renderer.scaleY = Math.pow(width/400, 0.6);
			_renderer.setMaxWidth(width);
			_renderer.x = Math.round((width -_renderer.width)/2);
			_renderer.y = Math.round(height * 0.94);
		}

        /** set the counters */
        private function _setIndex(index:Number):void {
            if(index > 0) {
                _track = index - 1;
                _selectedTrack = index;
            } else {
                _selectedTrack = 0;
            }
        }
		
		/** Rendering the captions. **/
		private function _renderCaptions(index:Number):void {
            _setIndex(index);
            _updateRenderer();
        }

        private function _updateRenderer():void {
			if (_track >= _tracks.length) return;
			
			// Update UI
            if(_tracks[_track].data) {
                _renderer.setCaptions(_tracks[_track].data);
            } else if(_tracks[_track].file) {
		        _loader.load(new URLRequest(_tracks[_track].file));
			} else {
				_renderer.setCaptions('');
			}
			_redraw();
		}
		
		
		/** Hide the renderer when idle. **/
		private function _stateHandler(event:PlayerStateEvent):void {
			_state = event.newstate;
			_redraw();
			if(_state == PlayerState.IDLE) {
				_renderer.setPosition(0);
			}
		}
		
		
		/** Update the position in the video. **/
		private function _timeHandler(event:MediaEvent):void {
			if (event.position >= -1)
				_renderer.setPosition(event.position);
		}
		
		
		private function _getTracks():Array {
			var list:Array = new Array();
			list.push({label: "Off"});
			for each (var t:Object in _tracks) {
				list.push({label: t.label});
			}
			return list;
		}
		
		public function getCaptionsList():Array {
			return _getTracks();
		}
		
		public function getCurrentCaptions():Number {
			return _selectedTrack;
		}
		
		public function setCurrentCaptions(index:Number):void {
			if (index >= 0 && _selectedTrack != index && index <= _tracks.length) {
				_renderCaptions(index);
				var tracks:Array = _getTracks();
				_player.config.captionlabel = tracks[_selectedTrack].label;
				Configger.saveCookie("captionLabel", tracks[_selectedTrack].label);
				_sendEvent(CaptionsEvent.JWPLAYER_CAPTIONS_CHANGED, tracks, _selectedTrack);
			}
		}
		
		private function _sendEvent(type:String, tracks:Array, track:Number):void {
			var captionsEvent:CaptionsEvent = new CaptionsEvent(type);
			captionsEvent.tracks = tracks;
			captionsEvent.currentTrack = track;
			dispatchEvent(captionsEvent);
		}
		
		/**
		 * @inheritDoc
		 */
		public function addGlobalListener(listener:Function):void {
			//_dispatcher.addGlobalListener(listener);
		}
		
		
		/**
		 * @inheritDoc
		 */
		public function removeGlobalListener(listener:Function):void {
			//_dispatcher.removeGlobalListener(listener);
		}
		
		public function hide(force:Boolean = false):void {
			
		}
		
		public function show():void {
			
		}
		
		
	}
	
	
}