package com.longtailvideo.jwplayer.utils {
	import flash.display.DisplayObject;
	import flash.display.DisplayObjectContainer;
	import flash.geom.Rectangle;
	import flash.utils.getQualifiedClassName;
	
	
	
	public class DisplayObjectUtils {
		
		public static function enumerateChildren(displayObject:DisplayObjectContainer):void{
			try {
				for (var i:Number = 0 ; i < displayObject.numChildren; i++){
					Logger.log(displayObject.getChildAt(i).name+":"+flash.utils.getQualifiedClassName(displayObject.getChildAt(i)));
				}
			} catch (err:Error){
				
			}
		}

		public static function describeDisplayObject(displayObject:DisplayObject, depth:Number=0):String {
			var descString:String = " ";
			for(var i:Number=0; i<=depth; i++) { descString += "-"; }
			descString += displayObject.name + " = {" +
				"width:" + displayObject.width + ", " +
				"height:" + displayObject.height + ", " +
				"x:" + displayObject.x + ", " +
				"y:" + displayObject.y + "}";
			
			var displayObjectContainer:DisplayObjectContainer = displayObject as DisplayObjectContainer;  
			if (displayObjectContainer) {
				for(var j:Number=0; j<displayObjectContainer.numChildren; j++) {
					descString += "\n" + describeDisplayObject(displayObjectContainer.getChildAt(j), depth+1);
				}
			}
			
			return descString;
			
		}

		
		/**
		 * duplicateDisplayObject
		 * 
		 * see: http://www.kirupa.com/forum/showthread.php?223798-ActionScript-3-Tip-of-the-Day/page12&p=1939827#172 
		 * 
		 * creates a duplicate of the DisplayObject passed.
		 * similar to duplicateMovieClip in AVM1
		 * @param target the display object to duplicate
		 * @param autoAdd if true, adds the duplicate to the display list
		 * in which target was located
		 * @return a duplicate instance of target
		 */
		public static function duplicateDisplayObject(target:DisplayObject, autoAdd:Boolean = false):DisplayObject {
			// create duplicate
			var targetClass:Class = Object(target).constructor;
			var duplicate:DisplayObject = new targetClass();
			
			// duplicate properties
			duplicate.transform = target.transform;
			duplicate.filters = target.filters;
			duplicate.cacheAsBitmap = target.cacheAsBitmap;
			duplicate.opaqueBackground = target.opaqueBackground;
			if (target.scale9Grid) {
				var rect:Rectangle = target.scale9Grid;
				// WAS Flash 9 bug where returned scale9Grid is 20x larger than assigned
				// rect.x /= 20, rect.y /= 20, rect.width /= 20, rect.height /= 20;
				duplicate.scale9Grid = rect;
			}
			
			// add to target parent's display list
			// if autoAdd was provided as true
			if (autoAdd && target.parent) {
				target.parent.addChild(duplicate);
			}
			return duplicate;
		}
		
		
	}
}