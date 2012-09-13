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
				'author':		item.author,
				'date':			item.date,
				'description':	item.description,
				'duration':		item.duration,
				'file':			item.file,
				'image':		item.image,
				'link':			item.link,
				'mediaid':		item.mediaid,
				'provider':		item.provider,
				'start':		item.start,
				'streamer':		item.streamer,
				'tags':			item.tags,
				'title':		item.title,
				'type':			item.provider
			};
			
			for (var i:String in item) {
				obj[i] = item[i];
			}
			
			if (item.levels.length > 0) {
				obj['levels'] = [];
				for each (var level:PlaylistItemLevel in item.levels) {
					var levelCopy:Object = {
						file: level.file,
						type: level.type,
						streamer: level.streamer,
						bitrate: level.bitrate,
						width: level.width,
						height: level.height
					};
					for (var dynamicProperty:String in level) {
						levelCopy[dynamicProperty] = level[dynamicProperty];
					}
					obj['levels'].push(levelCopy);
				}
			}
			
			return obj;
		}
		
		public static function stripDots(obj:*):* {
			var newObj:*;
			var type:String = getQualifiedClassName(obj); 
			switch(getQualifiedClassName(obj)) {
				case "Object":
				case "com.longtailvideo.jwplayer.model::PlaylistItem":
				case "com.longtailvideo.jwplayer.model::PlaylistItemLevel":
				case "com.longtailvideo.jwplayer.plugins::PluginConfig":
					newObj = {};
					for (var key:String in obj) {
						var newkey:String = key.replace(/\./g, "__dot__");
						newkey = newkey.replace(/\ /g, "__spc__");
						newkey = newkey.replace(/\-/g, "__dsh__");
						newkey = newkey.replace(/[^A-Za-z0-9\_]/g, "");
						newObj[newkey] = stripDots(obj[key]);
					}
					break;
				case "Array":
					newObj = [];
					for (var i:Number = 0; i < (obj as Array).length; i++) {
						newObj[i] = stripDots(obj[i]);
					}
					break;
				default:
					newObj = obj;
					break;
			}
			return newObj;
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