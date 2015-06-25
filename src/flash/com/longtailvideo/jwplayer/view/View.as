package com.longtailvideo.jwplayer.view {
import com.longtailvideo.jwplayer.events.MediaEvent;
import com.longtailvideo.jwplayer.model.Model;
import com.longtailvideo.jwplayer.player.SwfEventRouter;
import com.longtailvideo.jwplayer.plugins.IPlugin;
import com.longtailvideo.jwplayer.plugins.IPlugin6;
import com.longtailvideo.jwplayer.utils.RootReference;
import com.longtailvideo.jwplayer.utils.Stretcher;

import flash.display.DisplayObject;
import flash.display.Sprite;
import flash.display.StageAlign;
import flash.display.StageScaleMode;
import flash.events.Event;
import flash.geom.Rectangle;

public class View extends Sprite {

    private var _model:Model;
    private var _mediaLayer:Sprite;
    private var _pluginsLayer:Sprite;

    private var _plugins:Object;


    private static function rightClickHandler(e:Event):void {}

    public function View(model:Model) {
        _plugins = {};

        _model = model;
        _model.addEventListener(MediaEvent.JWPLAYER_MEDIA_LOADED, mediaLoaded);

        _mediaLayer = new Sprite();
        _pluginsLayer = new Sprite();

        this.addChild(_mediaLayer);
        this.addChild(_pluginsLayer);

        CONFIG::debugging {
            _mediaLayer.name = 'media';
            _pluginsLayer.name = 'plugins';
        }
    }

    public function setupView():void {
        RootReference.stage.scaleMode = StageScaleMode.NO_SCALE;
        RootReference.stage.align = StageAlign.TOP_LEFT;
        RootReference.stage.addEventListener('rightClick', rightClickHandler);
        RootReference.stage.addEventListener(Event.RESIZE, resizeHandler);
        redraw();
    }

    public function getSafeRegion():Rectangle {
        var width:Number  = RootReference.stage.stageWidth;
        var height:Number = RootReference.stage.stageHeight;
        return new Rectangle(0, 0, width, height);
    }

    public function fullscreen(mode:Boolean = true):void {
        // Flash fullscreen is not allowed in jw7. Browser DOM fullscreen must be used to show controls.
        redraw();
    }

    public function redraw():void {
        var width:Number  = RootReference.stage.stageWidth;
        var height:Number = RootReference.stage.stageHeight;
        // Don't need to resize the media if width/height are 0 (i.e. player is hidden in the DOM)
        if (width * height === 0) {
            return;
        }
        resizeMedia(width, height);
        resizePlugins(width, height);
    }

    public function addPlugin(id:String, plugin:IPlugin):void {
        if (!(plugin is IPlugin6)) {
            throw new Error("Incompatible plugin version");
        }
        var pluginDisplay:DisplayObject = plugin as DisplayObject;
        if (!_plugins[id] && pluginDisplay) {
            _plugins[id] = pluginDisplay;
            _pluginsLayer.addChild(pluginDisplay);
            var width:Number  = RootReference.stage.stageWidth;
            var height:Number = RootReference.stage.stageHeight;
            if (width * height === 0) {
                return;
            }
            try {
                plugin.resize(width, height);
            } catch (e:Error) {
                SwfEventRouter.error(e.code, e.message);
            }
        }
    }

    public function removePlugin(plugin:IPlugin):void {
        var pluginDisplay:DisplayObject = plugin as DisplayObject;
        if (pluginDisplay) {
            if (_pluginsLayer.contains(pluginDisplay)) {
                _pluginsLayer.removeChild(pluginDisplay);
            }
        }
    }

    public function loadedPlugins():Array {
        var list:Array = [];
        for (var pluginId:String in _plugins) {
            if (_plugins[pluginId] is IPlugin) {
                list.push(pluginId);
            }
        }
        return list;
    }

    public function getPlugin(id:String):IPlugin6 {
        return _plugins[id] as IPlugin6;
    }

    private function resizeMedia(width:Number, height:Number):void {
        if (_mediaLayer.numChildren > 0 && _model.media.display) {
            var preserveAspect:Boolean = (_model.fullscreen && _model.stretching === Stretcher.EXACTFIT);
            if (preserveAspect) {
                _model.config.stretching = Stretcher.UNIFORM;
                _model.media.resize(width, height);
                _model.config.stretching = Stretcher.EXACTFIT;
            } else {
                _model.media.resize(width, height);
            }
        }
    }

    private function resizePlugins(width:Number, height:Number):void {
        for (var pluginId:String in _plugins) {
            var plugin:IPlugin = _plugins[pluginId] as IPlugin;
            if (plugin) {
                plugin.resize(width, height);
            }
        }
    }

    private function resizeHandler(event:Event):void {
        redraw();
    }

    private function mediaLoaded(evt:MediaEvent):void {
        var disp:DisplayObject = _model.media.display;
        if (!disp || disp.parent !== _mediaLayer) {
            while (_mediaLayer.numChildren) {
                _mediaLayer.removeChildAt(0);
            }
            if (disp) {
                _mediaLayer.addChild(disp);
                var width:Number  = RootReference.stage.stageWidth;
                var height:Number = RootReference.stage.stageHeight;
                if (width * height === 0) {
                    return;
                }
                resizeMedia(width, height);
            }
        }
    }

}
}
