package com.longtailvideo.jwplayer.view
{
	import com.longtailvideo.jwplayer.events.GlobalEventDispatcher;
	import com.longtailvideo.jwplayer.player.IPlayer;
	import com.longtailvideo.jwplayer.player.PlayerVersion;
	import com.longtailvideo.jwplayer.utils.Configger;
	import com.longtailvideo.jwplayer.utils.Logger;
	import flash.system.System;
	import flash.display.MovieClip;
	import flash.events.ContextMenuEvent;
	import flash.net.URLRequest;
	import flash.net.navigateToURL;
	import flash.system.Capabilities;
	import flash.ui.ContextMenu;
	import flash.ui.ContextMenuItem;

   
   public class RightclickMenu extends GlobalEventDispatcher
   {
      
      public function RightclickMenu(param1:IPlayer, param2:MovieClip) {
         super();
         this._player = param1;
         this.context = new ContextMenu();
         this.context.hideBuiltInItems();
         param2.contextMenu = this.context;
         this.initializeMenu();
      }
      
      protected var _player:IPlayer;
      
      protected var context:ContextMenu;
      
      protected var copythis:ContextMenuItem;
      
      protected var watchon:ContextMenuItem;
	  
      protected var copyembedcode:ContextMenuItem;
      
      protected var debug:ContextMenuItem;
      
      protected var shareonfb:ContextMenuItem;
		
      protected var shareontwitter:ContextMenuItem;
	  
      protected function addItem(param1:ContextMenuItem, param2:Function, param3:Boolean = true) : void {
         param1.addEventListener(ContextMenuEvent.MENU_ITEM_SELECT,param2);
         param1.separatorBefore = param3;
         this.context.customItems.push(param1);
      }
      
      public function initializeMenu() : void {
	     setwatchonText();
	     addItem(watchon, watchonHandler);
         this.setCopythisText();
         this.addItem(this.copythis,this.copythisHandler);
         this.addItem(this.copyembedcode,this.copyembedcodeHandler,false);
		 this.setshareonfbText();
         this.addItem(this.shareonfb,this.shareonfbHandler);
         this.addItem(this.shareontwitter,this.shareontwitterHandler,false);
         if(Capabilities.isDebugger == true || !(this._player.config.debug == Logger.NONE))
         {
            this.debug = new ContextMenuItem("Logging to " + this._player.config.debug + "...");
            this.addItem(this.debug,this.debugHandler);
         }
      }
      
	  protected function setshareonfbText() : void {
         this.shareonfb = new ContextMenuItem("Share on Facebook");
         this.shareontwitter = new ContextMenuItem("Share on Twitter");
      }
	  
      protected function setCopythisText() : void {
         this.copythis = new ContextMenuItem("Copy video link");
         this.copyembedcode = new ContextMenuItem("Copy embed code");
      }
      
      protected function copythisHandler(param1:ContextMenuEvent) : void {
          if(this._player.config.watchonlink)
         {
            System.setClipboard(this._player.config.watchonlink);
         }
         else
         {
            System.setClipboard("http://www.themeflock.com/");
         }
      }
      
      protected function copyembedcodeHandler(param1:ContextMenuEvent) : void {
         if(this._player.config.embedcode)
         {
            System.setClipboard(this._player.config.embedcode);
         }
         else
         {
            System.setClipboard("http://www.themeflock.com/");
         }
      }
      
	 protected function setwatchonText():void {
     watchon = new flash.ui.ContextMenuItem(_player.config["watchontext"]);
		}
	  
	  protected function watchonHandler(evt:ContextMenuEvent):void {
			 var loc1:*=null;
            if (_player.config.hasOwnProperty("watchonlink")) 
            {
            flash.net.navigateToURL(new flash.net.URLRequest(com.longtailvideo.jwplayer.utils.Strings.cleanLink(_player.config["watchonlink"])), "_blank");
            }
            else 
            {
            flash.net.navigateToURL(new flash.net.URLRequest("http://www.themeflock.com"), "_blank");
            }
		}
	  
	  protected function shareonfbHandler(evt:ContextMenuEvent):void {
			 var loc1:*=null;
            if (_player.config.hasOwnProperty("watchonlink")) 
            {
            flash.net.navigateToURL(new flash.net.URLRequest(com.longtailvideo.jwplayer.utils.Strings.cleanLink("https://www.facebook.com/sharer/sharer.php?u=" + _player.config["watchonlink"])), "_blank");
            }
            else 
            {
            flash.net.navigateToURL(new flash.net.URLRequest("http://www.themeflock.com"), "_blank");
            }
		}
		
		
		protected function shareontwitterHandler(evt:ContextMenuEvent):void {
			 var loc1:*=null;
            if (_player.config.hasOwnProperty("watchonlink")) 
            {
            flash.net.navigateToURL(new flash.net.URLRequest(com.longtailvideo.jwplayer.utils.Strings.cleanLink("http://twitter.com/intent/tweet?url=" + _player.config["watchonlink"])), "_blank");
            }
            else 
            {
            flash.net.navigateToURL(new flash.net.URLRequest("http://www.themeflock.com"), "_blank");
            }
		}
	  
      protected function debugHandler(param1:ContextMenuEvent) : void {
         var _loc2_:Array = new Array(Logger.NONE,Logger.CONSOLE,Logger.TRACE);
         var _loc3_:Number = _loc2_.indexOf(this._player.config.debug);
         _loc3_ = _loc3_ == _loc2_.length - 1?0:_loc3_ + 1;
         this.debug.caption = "Logging to " + _loc2_[_loc3_] + "...";
         this.setCookie("debug",_loc2_[_loc3_]);
         this._player.config.debug = _loc2_[_loc3_];
      }
      
      protected function setCookie(param1:String, param2:*) : void {
         Configger.saveCookie(param1,param2);
      }
   }
}
