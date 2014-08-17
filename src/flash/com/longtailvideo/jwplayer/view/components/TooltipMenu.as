package com.longtailvideo.jwplayer.view.components {
	import com.longtailvideo.jwplayer.model.Color;
	import com.longtailvideo.jwplayer.view.interfaces.ISkin;
	
	import flash.display.DisplayObject;
	import flash.display.Sprite;
	import flash.events.MouseEvent;
	import flash.text.TextFormat;

	
	public class TooltipMenu extends TooltipOverlay {
		private var menuTop:DisplayObject;
		private var options:Vector.<TooltipOption>;
		private var overFormat:TextFormat;
		private var activeFormat:TextFormat;
		private var clickHandler:Function;
		
		public function TooltipMenu(name:String, skin:ISkin, click:Function=null) {
			super(skin);
			
			options = new Vector.<TooltipOption>;
			
			menuTop = getSkinElement('menuTop'+name);
			addChild(menuTop);
			
			clickHandler = click;
			
			overFormat = new TextFormat();
			overFormat.color = new Color(settings.overcolor).color;

			activeFormat = new TextFormat();
			activeFormat.color = new Color(settings.activecolor).color;

		}
		
		public function addOption(label:String, value:*):void {
			var option:TooltipOption = new TooltipOption(getSkinElement('menuOption'), getSkinElement('menuOptionOver'), getSkinElement('menuOptionActive'), 
														 textFormat, overFormat, activeFormat, 
														 (String(settings.fontcase).toLowerCase() == "upper"));
			option.y = menuTop.height + options.length * option.height;
			option.label = label;
			options.push(option);
			option.addEventListener(MouseEvent.CLICK, function(evt:MouseEvent):void {
				if (clickHandler is Function) {
					clickHandler(value);
				}
			});
			addChild(option);
		}
		
		public function setActive(index:Number):void {
			if (index >= 0 && index < options.length) {
				for (var i:Number=0; i < options.length; i++) {
					options[i].active = (i == index);
				}
			}			
		}
		
		public function clearOptions():void {
			while(options.length > 0) {
				removeChild(options.pop());
			}
			//this.height = menuTop.height;
		}
		
	}

}

import flash.display.*;
import flash.events.*;
import flash.text.TextField;
import flash.text.TextFieldAutoSize;
import flash.text.TextFormat;

internal class TooltipOption extends Sprite {
	private var outBack:DisplayObject;
	private var overBack:DisplayObject;
	private var activeBack:DisplayObject;
	private var isActive:Boolean = false;
	private var textFormat:TextFormat;
	private var overFormat:TextFormat;
	private var activeFormat:TextFormat;
	private var allcaps:Boolean = false;
	private var text:TextField;
	
	public function TooltipOption(out:DisplayObject, over:DisplayObject, active:DisplayObject, 
								  textFormat:TextFormat, overFormat:TextFormat, activeFormat:TextFormat, caps:Boolean):void {
		outBack = out;
		overBack = over;
		activeBack = active;
		this.textFormat = textFormat;
		this.overFormat = overFormat;
		this.activeFormat = activeFormat;
		this.allcaps = caps;
		this.buttonMode = true;
		this.mouseChildren = false;
		this.tabEnabled  = false;
		addChild(outBack);
		mouseChildren = false;
		if (overBack) {
			overBack.visible = false;
			addChild(overBack);
			addEventListener(MouseEvent.MOUSE_OVER, overHandler);			
			addEventListener(MouseEvent.MOUSE_OUT, outHandler);			
		}
		if (activeBack) {
			activeBack.visible = false;
			addChild(activeBack);
		}
		text = new TextField();
		text.defaultTextFormat = textFormat;
		text.height = outBack.height;
		text.autoSize = TextFieldAutoSize.LEFT;
		text.x = outBack.width;
		addChild(text);
	}
	
	private function overHandler(evt:MouseEvent):void {
		if (isActive) return;
		if (outBack && overBack) {
			outBack.visible = false;
			overBack.visible = true;
		}
		text.textColor = overFormat.color as uint;
	}
	
	private function outHandler(evt:MouseEvent):void {
		if (isActive) return;
		if (outBack && overBack) {
			outBack.visible = true;
			overBack.visible = false;
		}
		text.textColor = textFormat.color as uint;
	}
	
	public function set label(s:String):void {
		if (allcaps) s = s.toUpperCase();
		text.text = s;
	}
	
	public function set value(v:*):void {
	}
	
	public function set active(a:Boolean):void {
		isActive = a;
		if (activeBack) {
			isActive = a;
			activeBack.visible = isActive;
			outBack.visible = !isActive;
			overBack.visible = false;
		}
		text.textColor = uint(isActive ? activeFormat.color : textFormat.color);
	} 
	
}
