package com.longtailvideo.jwplayer.utils {
	import flash.display.Bitmap;
	import flash.display.BitmapData;
	import flash.display.DisplayObject;
	import flash.display.DisplayObjectContainer;
	import flash.display.Sprite;
	import flash.utils.getQualifiedClassName;
	
	
	public class Draw {
		/**
		 * Clone a sprite / movieclip.
		 *
		 * @param tgt	Sprite to clone.
		 * @param adc	Add as child to the parent displayobject.
		 *
		 * @return		The clone; not yet added to the displaystack.
		 **/
		public static function clone(tgt:DisplayObject, adc:Boolean = false):DisplayObject {
			var nam:String = getQualifiedClassName(tgt);
			if (nam == "flash.display::MovieClip") return tgt;
			if (tgt.hasOwnProperty("bitmapData") && tgt['bitmapData'] is BitmapData){
				return new Bitmap(tgt['bitmapData']);
			}
			
			var cls:Class;
			try {
				cls = tgt.loaderInfo.applicationDomain.getDefinition(nam) as Class;
			} catch (e:Error) {
				cls = Object(tgt).constructor;
			}
			var dup:* = new cls();
			dup.transform = tgt.transform;
			dup.filters = tgt.filters;
			dup.cacheAsBitmap = tgt.cacheAsBitmap;
			dup.opaqueBackground = tgt.opaqueBackground;
			dup.name = tgt.name;
			if (adc == true) {
				var idx:Number = tgt.parent.getChildIndex(tgt);
				tgt.parent.addChildAt(dup, idx + 1);
			}
			return dup;
		}
		
		
		/**
		 * Completely clear the contents of a displayobject.
		 *
		 * @param tgt	Displayobject to clear.
		 **/
		public static function clear(tgt:DisplayObjectContainer):void {
			var len:Number = tgt.numChildren;
			for (var i:Number = 0; i < len; i++) {
				tgt.removeChildAt(0);
			}
			tgt.scaleX = tgt.scaleY = 1;
		}
		
		
		/**
		 * Draw a rectangle on stage.
		 *
		 * @param tgt	Displayobject to add the rectangle to.
		 * @param col	Color of the rectangle.
		 * @param wid	Width of the rectangle.
		 * @param hei	Height of the rectangle.
		 * @param xps	X offset of the rectangle, defaults to 0.
		 * @param yps	Y offset of the rectangle, defaults to 0.
		 * @param alp	Alpha value of the rectangle, defaults to 0.
		 * @return		A reference to the newly drawn rectangle.
		 **/
		public static function rect(tgt:Sprite, col:String, wid:Number, hei:Number, xps:Number = 0, yps:Number = 0, alp:Number = 1):Sprite {
			var rct:Sprite = new Sprite();
			rct.x = xps;
			rct.y = yps;
			rct.graphics.beginFill(uint('0x' + col), alp);
			rct.graphics.drawRect(0, 0, wid, hei);
			tgt.addChild(rct);
			return rct;
		}
		
		/**
		 * 
		 * Smooth an image
		 **/
		public static function smooth(bitmap:Bitmap):void {
			try {
				bitmap.smoothing = true;
			} catch (err:Error) {
			}
		}
	}
}