package com.longtailvideo.jwplayer.utils
{
	import com.longtailvideo.jwplayer.model.IPlaylist;
	import com.longtailvideo.jwplayer.model.PlaylistItem;
	import com.longtailvideo.jwplayer.model.PlaylistItemLevel;
	
	import flash.geom.Rectangle;
	import flash.utils.getQualifiedClassName;

	public class JavascriptSerialization
	{

		public static function playlistToArray(list:IPlaylist):Array {
			var arry:Array = [];
			
			for (var i:Number=0; i < list.length; i++) {
				arry.push(playlistItemToObject(list.getItemAt(i)));
			}
			
			return arry;
		}
		
		public static function playlistItemToObject(item:PlaylistItem):Object {
			var obj:Object = {
				'description':	item.description && item.description.length ? item.description : undefined,
				'file':			item.file && item.file.length ? item.file : undefined,
				'image':		item.image && item.image.length ? item.image : undefined,
				'mediaid':		item.mediaid && item.mediaid.length ? item.mediaid : undefined,
				'title':		item.title && item.title.length ? item.title : undefined
			};
			
			for (var i:String in item) {
				obj[i] = item[i];
			}
			
			obj['sources'] = [];
			obj['tracks'] = [];
			if (item.levels.length > 0) {
				for each (var level:PlaylistItemLevel in item.levels) {
					var levelCopy:Object = {
						file: level.file,
						type: level.type ? level.type : undefined,
						label: level.label,
						"default": level["default"] ? true : false
					};
					obj['sources'].push(levelCopy);
				}
			}
			
			if (item.tracks.length > 0) {
				for each (var track:Object in item.tracks) {
					var trackCopy:Object = {
						file: track.file,
						kind: track.kind ? track.kind : undefined,
						label: track.label,
						"default": track["default"] ? true : false
					};
					obj['tracks'].push(trackCopy);
				}
			}
			
			if (!item.file && item.sources.length > 0) {
				item.file = item.sources[0].file;
			}
			
			delete obj.levels;
			return obj;
		}
		
		//function normalizes event data btwn js and as3, having to do with reserved keywords and operators.
		//an equivalent function in js should translate back after sending through ExternalInterface
		public static function stripDots(obj:*):* {
			var type:String = getQualifiedClassName(obj); 
			switch(type) {
				case "Object":
				case "com.longtailvideo.jwplayer.model::PlaylistItem":
				case "com.longtailvideo.jwplayer.model::PlaylistItemLevel":
				case "com.longtailvideo.jwplayer.plugins::PluginConfig":
					var newObj:Object = {};
					for (var key:String in obj) {
						var newkey:String = key.replace(/\./g, "__dot__");
						newkey = newkey.replace(/\ /g, "__spc__");
						newkey = newkey.replace(/\-/g, "__dsh__");
						newkey = newkey.replace(/[^A-Za-z0-9\_]/g, "");
						newkey = newkey.replace(/^default$/g, "__default__");
						newObj[newkey] = stripDots(obj[key]);
					}
					return newObj;
				case "Array":
					var newArr:Array = [];
					for (var i:uint = 0, l:uint = (obj as Array).length; i < l; i++) {
						newArr[i] = stripDots(obj[i]);
					}
					return newArr;
			}
			return obj;
		}
		
		public static function rectangleToObject(rect:Rectangle):Object {
			return {
				x: rect.x,
				y: rect.y,
				width: rect.width,
				height: rect.height
			};			
		} 
	}
}