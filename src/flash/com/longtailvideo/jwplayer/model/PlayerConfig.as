package com.longtailvideo.jwplayer.model {
	import com.longtailvideo.jwplayer.player.*;
	import com.longtailvideo.jwplayer.plugins.*;
	import com.longtailvideo.jwplayer.utils.*;
	
	import flash.events.*;
	import flash.utils.*;

	/**
	 * Configuration data for the player
	 *
	 * @author Pablo Schklowsky
	 */
	public dynamic class PlayerConfig extends EventDispatcher {
		protected var _singleItem:PlaylistItem = new PlaylistItem();

		protected var _playlistfile:String	= null;

		protected var _autostart:Boolean 	= false; 
		protected var _bandwidth:Number		= 1500;
		protected var _fullscreen:Boolean 	= false;
		protected var _item:Number			= 0;
		protected var _levels:Array			= null;
		protected var _mute:Boolean 		= false;
		protected var _repeat:Boolean 		= false; 
		protected var _controls:Boolean		= true; 
		
		//TODO: Move to ENUM class
		protected var _stretching:String 	= "uniform"; 
		protected var _volume:Number 		= 90;

		//TODO: Move to ENUM class
		protected var _controlbar:String 	= "over";
		protected var _dock:Boolean 		= true;
		protected var _height:Number 		= 400;
		protected var _playlistpos:String	= "none";
		protected var _playlistsize:String 	= "180";
		protected var _skin:String 			= null;
		protected var _width:Number 		= 280;
		
		protected var _plugins:String   = ""; //plugins initial string
		protected var _pluginConfig:Object 	= {};
		
		protected var _id:String			= "";
		protected var _debug:String			= Logger.NONE;
		
		public function PlayerConfig():void {
			controlbar = _controlbar;
			setPluginProperty('controlbar.idlehide', true); 
			playlistposition = _playlistpos;
			playlistsize = _playlistsize;
		}
		
		public function setConfig(config:Object):void {
			for (var item:String in config) {
				if (item.indexOf(".") > 0) {
					setPluginProperty(item, config[item]);
					_singleItem[item.toLowerCase()] = config[item];
				} else if (_singleItem.hasOwnProperty(item)) {
					if (item == "file" && Strings.extension(config[item]) == "xml" && !(config['provider'])) {
						setProperty("playlistfile", config[item]);
					} else if (item == "levels") {
						if (config[item] is Array) {
							for (var i:Number = 0; i < (config[item] as Array).length; i++) {
								var level:Object = config[item][i];
								_singleItem.addLevel(new PlaylistItemLevel(level.file, level.type, level.bitrate, level.width, level.streamer));
							}
						}
					} else {
						_singleItem[item.toLowerCase()] = config[item];
					}
				} else if (config[item.toLowerCase()] != null) {
					setProperty(item, config[item]);
				}
			}
		}
		
		protected function setProperty(name:String, value:*):void {
			if (hasOwnProperty(name) && value is String) {
				try {
					this[name] = TypeChecker.fromString(value, TypeChecker.getType(this, name));
				} catch (e:Error) {
					// 'name' was a read-only property
				}
			} else {
				this[name] = value;
			}
		}

		/**
		 * Sets the value of a plugin config property 
		 * @param name The parameter name in the form "pluginId.propertyname"
		 * @param value The value to set.
		 */
		protected function setPluginProperty(name:String, value:*):void {
			var pluginId:String = name.substring(0, name.indexOf(".")).toLowerCase();
			var pluginProperty:String = name.substring(name.indexOf(".") + 1, name.length).toLowerCase();

			if (pluginId && pluginProperty) {
				if (!_pluginConfig.hasOwnProperty(pluginId)) {
					_pluginConfig[pluginId] = new PluginConfig(pluginId);
				}
				if (value is String) {
					_pluginConfig[pluginId][pluginProperty] = TypeChecker.fromString(value);
				} else {
					_pluginConfig[pluginId][pluginProperty] = value;
				}
			}
		}

		/**
		 * Returns a string representation of the playlist's current PlaylistItem property.
		 * @param key The requested PlaylistItem property
		 */
		protected function playlistItem(key:String):String {
			try {
				return _singleItem[key].toString();
			} catch (e:Error) {
			}

			return "";
		}

		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		// PLAYLIST PROPERTIES
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		
		/** Location of xml playlist file to load **/
		public function get playlist():String { return _playlistfile; }
		public function set playlist(x:String):void { 
			_playlistfile = x; 
		}
		public function set playlistfile(x:String):void {
			_playlistfile = x;
		} 


		/** Text description of the file. **/
		public function get description():String { return playlistItem('description'); }

		/** Duration of the file in seconds. **/
		public function get duration():String { return playlistItem('duration'); }

		/** Location of the mediafile or playlist to play. **/
		public function get file():String { return playlistItem('file'); }

		/** Location of a preview image; shown in display and playlist. **/
		public function get image():String { return playlistItem('image'); }

		/** Unique identifier for media content. **/		
		public function get mediaid():String { return playlistItem('mediaid'); }		
		
		/** Position in seconds where playback has to start. Won't work for regular (progressive) videos, but only for streaming (HTTP / RTMP). **/
		public function get start():String { return playlistItem('start'); }
		
		/** Location of an rtmp/http server instance to use for streaming. Can be an RTMP application or external PHP/ASP file. **/
		public function get streamer():String { return playlistItem('streamer'); }
		
		/** Title of the video, shown in the display or playlist. **/
		public function get title():String { return playlistItem('title'); }

		/**
		 * By default, the type is detected by the player based upon the file extension. If there's no suitable
		 * extension or the player detects the type wrong, it can be manually set. The following default types are
		 * supported:
		 * <ul>
		 * <li>video: progressively downloaded FLV / MP4 video, but also AAC audio.</li>
		 * <li>sound: progressively downloaded MP3 files.</li>
		 * <li>image: JPG/GIF/PNG images.</li>
		 * <li>youtube: videos from Youtube.</li>
		 * <li>http: FLV/MP4 videos played as http speudo-streaming.</li>
		 * <li>rtmp: FLV/MP4/MP3 files played from an RTMP server.</li>
		 * </ul>
		 **/
		public function get provider():String { return playlistItem('provider'); }

		/** Deprecated.  Use "provider" flashvar. **/
		public function get type():String { return playlistItem('provider'); }

		/** PlaylistItem representing single-item playlist based on flashvars (e.g. config[file], config[image], etc. **/
		public function get singleItem():PlaylistItem { return _singleItem; }

		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		// LAYOUT PROPERTIES
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		/** Position of the controlbar. Can be set to top, bottom, over and none.  @default bottom **/
		public function get controlbar():String { 
			if (_pluginConfig['controlbar'] && _pluginConfig['controlbar'].hasOwnProperty('position'))
				return _pluginConfig['controlbar']['position'];
			else return _controlbar;
		}
		public function set controlbar(x:String):void { 
			setPluginProperty('controlbar.position', x.toLowerCase()); 
		}

		/** Set this to true to show the dock with large buttons in the top right of the player. Available since 4.5.  @default true **/
		public function get dock():Boolean { return _dock; }
		public function set dock(x:Boolean):void {
			_dock = x;
		}

		/** Height of the display in pixels. @default 280 **/
		public function get height():Number { return _height; }
		public function set height(x:Number):void { _height = x; }

		/** Position of the playlist. Can be set to bottom, over, right or none. @default none **/
		public function get playlistposition():String { 
			if (_pluginConfig['playlist'] && _pluginConfig['playlist'].hasOwnProperty('position'))
				return _pluginConfig['playlist']['position'];
			else return _playlistpos;
		}
		public function set playlistposition(x:String):void { 
			setPluginProperty('playlist.position', x.toLowerCase()); 
		}

		/** When below this refers to the height, when right this refers to the width of the playlist. @default 180 **/
		public function get playlistsize():String { return _playlistsize; }
		public function set playlistsize(x:String):void {
			_playlistsize = x;
			setPluginProperty('playlist.size', x.toString());
		}

		/** 
		 * Location of a SWF or ZIP file with the player graphics. The player skinning documentation gives more info on this.  
		 * SVN contains a couple of example skins. 
		 **/
		public function get skin():String { return _skin; }
		public function set skin(x:String):void { _skin = x; }

		/** Width of the display in pixels. @default 400 **/
		public function get width():Number { return _width; }
		public function set width(x:Number):void { _width = x; }

		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		// BEHAVIOR PROPERTIES
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		/** Automatically start the player on load. @default false **/
		public function get autostart():Boolean { return _autostart; }
		public function set autostart(x:Boolean):void { _autostart = x; }

		/** Current fullscreen state **/		
		public function get fullscreen():Boolean { return _fullscreen; }
		public function set fullscreen(x:Boolean):void { _fullscreen = x; }		
		
		/** PlaylistItem that should start to play. Use this to set a specific start-item. @default 0 **/
		public function get item():Number { return _item; }
		public function set item(x:Number):void { _item = x; }

		/** Mute all sounds on startup. This value is set in a user cookie, and is retrieved the next time the player loads. **/
		public function get mute():Boolean { return _mute; }
		public function set mute(x:Boolean):void { _mute = x;}

		/** Set to list to play the entire playlist once, to always to continously play the song/video/playlist and to single to continue repeating the selected file in a playlist. @default none **/
		public function get repeat():Boolean { return _repeat; }
		public function set repeat(x:*):void { _repeat = (x.toString().toLowerCase() != "false"); }

		/** Defines how to resize images in the display. Can be none (no stretching), exactfit (disproportionate), uniform (stretch with black borders) or fill (uniform, but completely fill the display). @default uniform **/
		public function get stretching():String{ return _stretching; }
		public function set stretching(x:String):void { _stretching = x ? x.toLowerCase() : ""; }

		/** Startup volume of the player. Can be 0 to 100. Is saved in a cookie. @default 90 **/
		public function get volume():Number { return _volume; }
		public function set volume(x:Number):void { _volume = x; }

		/** Startup volume of the player. Can be 0 to 100. Is saved in a cookie. @default 90 **/
		public function get controls():Boolean { return _controls; }
		public function set controls(x:Boolean):void { _controls =  x; }

		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		// PLUGINS
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		/** Which plugins to load **/		
		public function get plugins():String { return _plugins; }
		public function set plugins(x:String):void { _plugins = x; }

		/** The current debugging mode. **/		
		public function get debug():String {
			return _debug;
		}

		public function set debug(x:String):void {
			if (x != "0"){
				_debug = x; 
			}
		}
		
		/**
		 * Returns a PluginConfig containing plugin configuration information
		 * 
		 * @param pluginId Name of the plugin whose config to return.
		 */
		public function pluginConfig(pluginId:String):PluginConfig {
			pluginId = pluginId.toLowerCase();
			if (_pluginConfig.hasOwnProperty(pluginId)) {
				return _pluginConfig[pluginId] as PluginConfig;
			} else if (this[pluginId] && getQualifiedClassName(this[pluginId]) == "Object") {
				var duplicatedConfig:PluginConfig = new PluginConfig(pluginId, this[pluginId]);
				_pluginConfig[pluginId] = duplicatedConfig;
				return duplicatedConfig;
			} else {
				var newConfig:PluginConfig = new PluginConfig(pluginId);
				_pluginConfig[pluginId] = newConfig;
				return newConfig;
			}
		}
		
		/**
		 * Overwrites a plugin's configuration.  Use with caution.
		 **/
		public function setPluginConfig(pluginId:String, pluginConfig:PluginConfig):void {
			if (pluginId && pluginConfig) {
				_pluginConfig[pluginId] = pluginConfig;
			}
		}
		
		/** A list of available pluginConfig keys. **/
		public function get pluginIds():Array {
			var names:Array = [];

			// Only include loaded plugins
			for each (var lp:String in _plugins.split(",")) {
				var plugName:String = (lp.substr(lp.lastIndexOf("/")+1).replace(/(.*)\.swf$/i, "$1").split("-")[0] as String).toLowerCase();
				if (plugName) {
					names.push(plugName);
				}
			}
			
			return names;
		}

		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		// JAVASCRIPT INTERACTION
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		
		/** The player's Javascript objectID. Auto-detected, but should be set manually for Linux Javascript support. **/
		public function get id():String { return _id; }
		public function set id(x:String):void { PlayerVersion.id = _id = x; }
		
	}
}