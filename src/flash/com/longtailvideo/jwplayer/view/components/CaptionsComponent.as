package com.longtailvideo.jwplayer.view.components {


import com.longtailvideo.jwplayer.events.CaptionsEvent;
import com.longtailvideo.jwplayer.events.MediaEvent;
import com.longtailvideo.jwplayer.events.PlayerStateEvent;
import com.longtailvideo.jwplayer.events.PlaylistEvent;
import com.longtailvideo.jwplayer.events.TrackEvent;
import com.longtailvideo.jwplayer.parsers.DFXP;
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

        private static var _order:Array = ['playlist', 'subtitles', 'meta'];

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

		/** XML connect and parse object. **/
		private var _loader:URLLoader;
		/* Reference to the JW Player. */
		private var _player:IPlayer;
		/** Reference to the captions renderer. **/
		private var _renderer:CaptionRenderer;
		/** Player state. **/
		private var _state:String;

		/**  list of tracks with type and unique label **/
		private var _tracks:Array;
        /** the current track type and id **/
        private var _track:Object;

		/** Constructor; inits the parser, selector and renderer. **/
		public function CaptionsComponent(player:IPlayer) {

			_loader = new URLLoader();
			_loader.addEventListener(Event.COMPLETE, _loaderHandler);
			_loader.addEventListener(IOErrorEvent.IO_ERROR, _errorHandler);
			_loader.addEventListener(SecurityErrorEvent.SECURITY_ERROR, _errorHandler);
			
			// Connect to the player API.
			_player = player;
			_player.addEventListener(PlaylistEvent.JWPLAYER_PLAYLIST_ITEM,_itemHandler);
			_player.addEventListener(MediaEvent.JWPLAYER_MEDIA_META,_metaHandler);
			_player.addEventListener(PlayerStateEvent.JWPLAYER_PLAYER_STATE,_stateHandler);
			_player.addEventListener(MediaEvent.JWPLAYER_MEDIA_TIME,_timeHandler);
            _player.addEventListener(TrackEvent.JWPLAYER_SUBTITLES_TRACKS, _subtitlesTracksHandler);
            _player.addEventListener(TrackEvent.JWPLAYER_SUBTITLES_TRACK_CHANGED, _subtitlesTrackChangedHandler);

            _tracks = new Array();

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
		
		private static function _extend(target:Object, defaults:Object, options:Object):void {
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
		
		private static function _rgbHex(color:*):String {
			var hex:String = String(color).replace('#','');
			if (hex.length === 3) {
				hex = hex.charAt(0)+hex.charAt(0)+hex.charAt(1)+hex.charAt(1)+hex.charAt(2)+hex.charAt(2);
			}
			return '#'+hex.substr(-6);
		};
		
		private static function _hexToUint(hex:String):uint {
			return parseInt(hex.substr(-6), 16);
		}
		
		/** The captions loader returns errors (file not found or security error). **/
		private function _errorHandler(event:ErrorEvent):void {
			Logger.log(event.text);
		}

        /** return the track index at which to insert a new element of type type **/
        private function getInsertionIndex(type:String):int {
            var typeFunction:Function = function(item:*, index:int, array:Array):String {
                return item.type;
            };
            var typeArray:Array = _tracks.map(typeFunction);

            if(typeArray.lastIndexOf(type) >= 0) {
                return typeArray.lastIndexOf(type) + 1;
            } else {
                if(_order[0] == type) {
                    return 0;
                }
                var found:Boolean = false;
                for(var i:int = _order.length; i > 0; i--) {
                    if (_order[i] == type) {
                        found = true;
                        break;
                    }
                    if (found) {
                        if (typeArray.lastIndexOf(_order[i]) >= 0) {
                            return typeArray.lastIndexOf(_order[i]) + 1;
                        }
                    }
                }
                return 0;
            }

        }

        /** Handle a list of subtitles tracks */
        private function _subtitlesTracksHandler(event:TrackEvent):void {
            if(event.type != TrackEvent.JWPLAYER_SUBTITLES_TRACKS) {
                throw new Error("wrong event");
            }

            _removeTrackType("subtitles");

            if(event.tracks != null) {
                for(var i:int = 0; i < event.tracks.length; i++) {
                    var obj:Object = {
                        type: "subtitles",
                        id: i,
                        label: event.tracks[i].name
                    };
                    _tracks.splice(getInsertionIndex("subtitles"), 0, obj);
                    if(i == event.currentTrack) {
                        _track = obj;
                    }
                }

            }
            _setDefaultTrack();
            _resetRenderer();
            _renderCaptions();
            _redraw();
            _notifyCaptions(CaptionsEvent.JWPLAYER_CAPTIONS_LIST);
        }

        /** Handle a subtitle track index change */
        private function _subtitlesTrackChangedHandler(event:TrackEvent):void {
            if (event.type != TrackEvent.JWPLAYER_SUBTITLES_TRACK_CHANGED) {
                throw new Error("wrong event");
            }
            if(event.currentTrack < 0) {
                _track = null;
            } else {
                _track = {
                    type: "subtitles",
                    id: event.currentTrack,
                    label: event.tracks[event.currentTrack].name
                };
            }
            _redraw();
            _notifyCaptions(CaptionsEvent.JWPLAYER_CAPTIONS_CHANGED);
        }

        private function _resetRenderer():void {
            _renderer.setPosition(0);
            _renderer.setCaptions('');
        }

        private function _notifyCaptions(type:String):void {
            var captionsEvent:CaptionsEvent = new CaptionsEvent(type);
            captionsEvent.tracks = getCaptionsList();
            captionsEvent.currentTrack = getCurrentCaptions();
            dispatchEvent(captionsEvent);
        }

        private function _removeTrackType(type:String):void {
            var newTracks:Array = new Array();
            for(var i:int = 0; i < _tracks.length; i++) {
                if(_tracks[i].type != type) {
                    newTracks.push(_tracks[i]);
                }
            }
            _tracks = newTracks;
            if(_track != null && _track.type == type) {
                _track = null;
            }
        }

        private function _getTrackType(type:String):Array {
            var ret:Array = new Array();
            for(var i:int = 0; i < _tracks.length; i++) {
                if(_tracks[i].type == type) {
                    ret.push(_tracks[i]);
                }
            }
            return ret;
        }

        private function _setDefaultTrack():void {
            _track = null;
            if (_player.config.captionlabel) {
                for (var i:int = 0; i < _tracks.length; i++) {
                    if (_tracks[i].label == _player.config.captionlabel) {
                        _track = _tracks[i];
                        break;
                    }
                }
            }
        }

        /** Handle changed tracks (MediaPlaylist) **/
        private function _subtitlesHandler(event:TrackEvent):void {

        }

		/** Check playlist item for captions. **/
		private function _itemHandler(event:PlaylistEvent):void {
            var i:int;

            _tracks = new Array();
            _track = null;

            var item:Object = _player.playlist.currentItem;
			if (item && item['tracks']) {
                var itemTracks:Object = item['tracks'];

                for (i = 0; i < itemTracks.length; i++) {
                    var itemTrack:Object = itemTracks[i];
                    var kind:String = itemTrack.kind.toLowerCase();
                    if ((kind == "captions" || kind == "subtitles") && itemTrack.file) {
                        _tracks.push({
                            type: "playlist",
                            id: i,
                            label: itemTrack.label ? itemTrack.label : i.toString(),
                            isDefault: itemTrack['default'],
                            file: itemTrack.file
                        });
                    }
                }
            }

			for (i = 0; i < _tracks.length; i++) {
				if (_tracks[i].isDefault) {
					_track = _tracks[i];
					break;
				}
			}

            _setDefaultTrack();
            _resetRenderer();
			_renderCaptions();
			_redraw();
            _notifyCaptions(CaptionsEvent.JWPLAYER_CAPTIONS_LIST);
		};


		/** Parse and display external captions. **/
		private function _loaderHandler(event:Event):void {
            if(_track != null) {
                try {
                    if (XML(event.target.data).localName().toString().toLowerCase() == DFXP.NAME) {
                        _track.data = DFXP.parseCaptions(XML(event.target.data), _defaults);
                    } else {
                        _track.data = SRT.parseCaptions(String(event.target.data));
                    }
                } catch (error:Error) {
                    _track.data = SRT.parseCaptions(String(event.target.data));
                }
                if (!_track.data.length) {
                    Logger.log('No captions entries found in file. Probably not a valid SRT or DFXP file?');
                } else {
                    _renderer.setCaptions(_track.data);
                }
            }
			_redraw();
		};

		/** Check for captions in metadata. **/
		private function _metaHandler(event:MediaEvent):void {
			if(_state == PlayerState.IDLE) { return; }
            _redraw();
			if(event.metadata.type == 'textdata') {
                var label:String = "captions";
                if (event.metadata.provider == "rtmp" || event.metadata.provider == "hls") {
                    label = "On";
                }
                var obj:Object = {
                    type: "meta",
                    id: event.metadata.trackid,
                    label: label
                };

                if(_getTrackType("meta").length == 0) {
                    _tracks.push(obj);
                    _notifyCaptions(CaptionsEvent.JWPLAYER_CAPTIONS_LIST);
                }

                if (obj.label == _getTrackType("meta")[0].label) {
                    _renderer.setCaptions(event.metadata.text.replace(/\n$/,''));
                }
			} else if (event.metadata.trackinfo && _tracks.length == 0) {
				_metaTracks(event.metadata.trackinfo);
			}
		}


		/** Parse track info from MP4 metadata. **/
		private function _metaTracks(info:Object):void {
			for(var i:int = 0; i < info.length; i++) {
				try {
					if(info[i].sampledescription[0].sampletype == 'tx3g') {
						_tracks.push({
							type: "meta",
							id: i,
							label: ISO639.label(info[i].language)
						});
					}
				} catch (e:Error) {}
			}
			_initializeCaptions();
		}

		private function _initializeCaptions():void {
            _setDefaultTrack();
			_renderCaptions();
			_redraw();
            _notifyCaptions(CaptionsEvent.JWPLAYER_CAPTIONS_LIST);
		}


		/** Show/hide the captions **/
		private function _redraw():void {
            _renderer.visible = _tracks.length > 0 && _state != PlayerState.IDLE && getCurrentCaptions() > 0;
		}


		/** Resize the captions, relatively smaller as the screen grows */
		public function resize(width:Number, height:Number):void {
			_renderer.scaleX = _renderer.scaleY = Math.pow(width/400, 0.6);
			_renderer.setMaxWidth(width);
			_renderer.x = Math.round((width -_renderer.width)/2);
			_renderer.y = Math.round(height * 0.94);
		}

		/** Rendering the captions. **/
		private function _renderCaptions():void {
			// Update UI
			if(_track != null && _track.file) {
				if(_track.data) {
					_renderer.setCaptions(_track.data);
				} else {
					_loader.load(new URLRequest(_track.file));
				}
			} else {
				_renderer.setCaptions('');
			}
			_redraw();
		};


		/** Hide the renderer when idle. **/
		private function _stateHandler(event:PlayerStateEvent):void {
			_state = event.newstate;
			_redraw();
			if(_state == PlayerState.IDLE) {
				_renderer.setPosition(0);
			}
		};


		/** Update the position in the video. **/
		private function _timeHandler(event:MediaEvent):void {
			if (event.position >= -1)
				_renderer.setPosition(event.position);
		};

		public function getCaptionsList():Array {
            var list:Array = new Array();
            list.push({label: "Off"});
            for (var i:int = 0; i < _tracks.length; i++) {
                list.push({label: _tracks[i].label});
            }
            return list;
		}

		public function getCurrentCaptions():int {
            if (_track != null) {
                for(var i:int = 0; i < _tracks.length; i++) {
                    if(_tracks[i].type == _track.type && _tracks[i].id == _track.id) {
                        return i+1;
                    }
                }
            }
			return 0;
		}

		public function setCurrentCaptions(index:int):void {
			if (index >= 0 && getCurrentCaptions() != index && index <= _tracks.length) {
				_renderCaptions();
                if(index == 0) {
                    _track = null;
                } else {
                    _track = _tracks[index - 1];
                }
				_player.config.captionlabel = _track == null ? null : _track.label;
				Configger.saveCookie("captionLabel", _player.config.captionlabel);
                _notifyCaptions(CaptionsEvent.JWPLAYER_CAPTIONS_CHANGED);
			}
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
		
		
	};
	
	
}