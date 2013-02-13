package com.longtailvideo.jwplayer.view.components {
	
	import com.longtailvideo.jwplayer.events.CaptionsEvent;
	import com.longtailvideo.jwplayer.events.MediaEvent;
	import com.longtailvideo.jwplayer.events.PlayerStateEvent;
	import com.longtailvideo.jwplayer.events.PlaylistEvent;
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
		
		/** Save the last resize dimensions. **/
		private var _dimensions:Array;
		
		/** Cookie object for storing track prefs. **/
		//private var _cookie:SharedObject;
		/** Default style properties. **/
		private var _defaults:Object = {
			color: '#FFFFFF',
			fontSize: 15,
			back: true
		};
		
		private var _style:Object = {
			fontFamily: 'Arial,sans-serif',
			fontStyle: 'normal',
			fontWeight: 'normal',
			leading: 5,
			textAlign: 'center',
			textDecoration: 'none'
		}
		
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
		/** Map with style properties loaded by DFXP. **/
		private var _styles:Object;
		/** Currently active track. **/
		private var _track:Number;
		/** Current listing of tracks. **/
		private var _tracks:Array;
		/** Currently selected track index. **/
		private var _selectedTrack:Number;
		
		
		/** Constructor; inits the parser, selector and renderer. **/
		public function CaptionsComponent(player:IPlayer) {

			//_cookie = SharedObject.getLocal('com.jeroenwijering','/');
			_loader = new URLLoader();
			_loader.addEventListener(Event.COMPLETE,_loaderHandler);
			_loader.addEventListener(IOErrorEvent.IO_ERROR,_errorHandler);
			_loader.addEventListener(SecurityErrorEvent.SECURITY_ERROR,_errorHandler);
			_tracks = new Array();
			
			// Connect to the player API.
			_player = player;
			_player.addEventListener(PlaylistEvent.JWPLAYER_PLAYLIST_ITEM,_itemHandler);
			_player.addEventListener(MediaEvent.JWPLAYER_MEDIA_META,_metaHandler);
			_player.addEventListener(PlayerStateEvent.JWPLAYER_PLAYER_STATE,_stateHandler);
			_player.addEventListener(MediaEvent.JWPLAYER_MEDIA_TIME,_timeHandler);
			
			var config:Object = _player.config.captions;
			
			for (var rule:String in _defaults) {
				if (config && config[rule.toLowerCase()] != undefined) {
					// Fix for colors, since the player automatically converts to HEX.
					if(rule == 'color') {
						_style['color'] = '#'+String(config['color']).substr(-6);
					} else {
						_style[rule] = config[rule.toLowerCase()];
					}
				}
				else {
					_style[rule] = _defaults[rule];
				}
			}
			
			// Place renderer and selector.
			_renderer = new CaptionRenderer(_style,_style.back);
			addChild(_renderer);
			_redraw();
		};
		
		
		/** The captions loader returns errors (file not found or security error). **/
		private function _errorHandler(event:ErrorEvent):void {
			Logger.log(event.text);
		};
		
		/** Check playlist item for captions. **/
		private function _itemHandler(event:PlaylistEvent):void {
			_track = 0;
			_tracks = new Array();
			_renderer.setPosition(0);
			_item = _player.playlist.currentItem;
			
			var tracks:Object = _item["tracks"];
			var caps:Array = [];
			for (var i:Number = 0; i < tracks.length; i++) {
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
		
		
		/** Check for captions in metadata. **/
		private function _metaHandler(event:MediaEvent):void {
			if(_state == PlayerState.IDLE) { return; }
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
				if(info[i].sampledescription[0].sampletype == 'tx3g') {
					_tracks.push({
						data: undefined,
						file: undefined,
						id: i,
						label: ISO639.label(info[i].language)
					});
				}
			}
			
			var defaultTrack:Number = 0;
			var tracks:Array = _getTracks();
			
			if (_player.config.captionlabel) {
				for (i = 0; i < tracks.length; i++) {
					if (tracks[i].label == _player.config.captionlabel) {
						defaultTrack = i;
						break;
					}
				}
			}
			
			_renderCaptions(defaultTrack);
			_redraw();
			_sendEvent(CaptionsEvent.JWPLAYER_CAPTIONS_LIST, tracks, _selectedTrack);
		};
		
		
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
		};
		
		
		/** Resize the captions, relatively smaller as the screen grows */
		public function resize(width:Number, height:Number):void {
			_dimensions = new Array(width,height);
			_renderer.width = Math.round(400 * Math.pow(width/400,0.6));
			_renderer.x = Math.round(width/2 -_renderer.width/2);
			_renderer.scaleY = _renderer.scaleX;
			_renderer.y = Math.round(height * 0.94);
		};
	
		
		/** Rendering the captions. **/
		private function _renderCaptions(index:Number):void {
			if(index > 0) {
				_track = index - 1;
				_selectedTrack = index;
			} else {
				_selectedTrack = 0;
			}
			
			if (_track >= _tracks.length) return;

			// Update UI
			if(_tracks[_track].file) {
				if(_tracks[_track].data) {
					_renderer.setCaptions(_tracks[_track].data);
				} else { 
					_loader.load(new URLRequest(_tracks[_track].file));
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
		};
		
		
		/** Update the position in the video. **/
		private function _timeHandler(event:MediaEvent):void {
			_renderer.setPosition(event.position);
		};
		
		
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
		
		
	};
	
	
}
