package com.longtailvideo.jwplayer.view {
import com.longtailvideo.jwplayer.events.MediaEvent;
import com.longtailvideo.jwplayer.model.Model;
import com.longtailvideo.jwplayer.player.IInstreamPlayer;
import com.longtailvideo.jwplayer.plugins.IPlugin;
import com.longtailvideo.jwplayer.plugins.IPlugin6;
import com.longtailvideo.jwplayer.plugins.PluginConfig;
import com.longtailvideo.jwplayer.utils.Logger;
import com.longtailvideo.jwplayer.utils.RootReference;
import com.longtailvideo.jwplayer.utils.Stretcher;

import flash.display.DisplayObject;
import flash.display.Sprite;
import flash.display.StageAlign;
import flash.display.StageDisplayState;
import flash.display.StageScaleMode;
import flash.events.ErrorEvent;
import flash.events.Event;
import flash.geom.Rectangle;

public class View extends Sprite {

    protected var _model:Model;
    protected var _preserveAspect:Boolean = false;
    protected var _normalScreen:Rectangle;
    protected var _mediaLayer:Sprite;
    protected var _componentsLayer:Sprite;
    protected var _pluginsLayer:Sprite;
    protected var _plugins:Object;

    // Indicates whether the instream player is being displayed
    protected var _allPlugins:Vector.<IPlugin>;
    protected var _instreamMode:Boolean = false;
    protected var _instreamPlayer:IInstreamPlayer;
    protected var _instreamLayer:Sprite;
    protected var _instreamPlugin:IPlugin;

    public function View(model:Model) {
        _model = model;
        _model.addEventListener(MediaEvent.JWPLAYER_MEDIA_LOADED, mediaLoaded);

        _normalScreen = new Rectangle(
                0,
                0,
                _model.width,
                _model.height
        );

        setupLayers();
    }

    public function setupView():void {
        RootReference.stage.scaleMode = StageScaleMode.NO_SCALE;
        RootReference.stage.stage.align = StageAlign.TOP_LEFT;

        RootReference.stage.addChildAt(this, 0);

        RootReference.stage.addEventListener(Event.RESIZE, resizeHandler);

        redraw();
    }

    public function fullscreen(mode:Boolean = true):void {
        try {
            RootReference.stage.displayState = mode ? StageDisplayState.FULL_SCREEN : StageDisplayState.NORMAL;
        } catch (e:Error) {
            Logger.log("Could not enter fullscreen mode: " + e.message);
        }
    }

    /** Redraws the plugins and player components **/
    public function redraw():void {
        if (!_model.fullscreen) {
            _normalScreen.width  = RootReference.stage.stageWidth;
            _normalScreen.height = RootReference.stage.stageHeight;
        }

        if (_preserveAspect) {
            if (!_model.fullscreen && _model.stretching != Stretcher.EXACTFIT) {
                _preserveAspect = false;
            }
        } else {
            if (_model.fullscreen && _model.stretching == Stretcher.EXACTFIT) {
                _preserveAspect = true;
            }
        }

        resizeMedia(_model.width, _model.height);

        _instreamLayer.graphics.clear();
        _instreamLayer.graphics.beginFill(0);
        _instreamLayer.graphics.drawRect(0, 0, _model.width, _model.height);
        _instreamLayer.graphics.endFill();
    }

    public function addPlugin(id:String, plugin:IPlugin):void {
        if (!(plugin is IPlugin6)) {
            throw new Error("Incompatible plugin version");
        }
        try {
            _allPlugins.push(plugin);
            var plugDO:DisplayObject = plugin as DisplayObject;
            if (!_plugins[id] && plugDO) {
                _plugins[id] = plugDO;
                _pluginsLayer.addChild(plugDO);
            }
        } catch (e:Error) {
            dispatchEvent(new ErrorEvent(ErrorEvent.ERROR, false, false, e.message));
        }
    }

    public function removePlugin(plugin:IPlugin):void {
        var id:String = plugin.id.toLowerCase();
        if (id && _plugins[id] is IPlugin) {
            _pluginsLayer.removeChild(_plugins[id]);
            delete _plugins[id];
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

    public function bringPluginToFront(id:String):void {
        var plugin:IPlugin = getPlugin(id);
        _pluginsLayer.setChildIndex(plugin as DisplayObject, _pluginsLayer.numChildren - 1);
    }

    public function setupInstream(instreamPlayer:IInstreamPlayer, instreamDisplay:DisplayObject, plugin:IPlugin):void {
        _instreamPlayer = instreamPlayer;
        _instreamPlugin = plugin;

        if (instreamDisplay) {
            _instreamLayer.addChild(instreamDisplay);
        }
        _mediaLayer.visible = false;
        _componentsLayer.visible = false;

        try {
            var pluginDO:DisplayObject = plugin as DisplayObject;
            if (pluginDO) {
                _pluginsLayer.removeChild(pluginDO);
                _instreamLayer.addChild(pluginDO);
            }
        } catch (e:Error) {
            Logger.log("Could not add instream plugin to display stack");
        }

        _instreamMode = true;
    }

    public function destroyInstream():void {
        if (_instreamPlugin && _instreamPlugin is DisplayObject) {
            _pluginsLayer.addChild(_instreamPlugin as DisplayObject);
        }
        _mediaLayer.visible = true;
        _componentsLayer.visible = true;

        while (_instreamLayer.numChildren > 0) {
            _instreamLayer.removeChildAt(0);
        }

        _instreamMode = false;
    }

    public function hideInstream():void {

    }

    protected function setupLayers():void {
        var currentLayer:uint = 0;

        _mediaLayer = setupLayer("media", currentLayer++);
        _componentsLayer = setupLayer("components", currentLayer++);
        _pluginsLayer = setupLayer("plugins", currentLayer++);
        _instreamLayer = setupLayer("instream", currentLayer++);

        _plugins = {};
        _allPlugins = new Vector.<IPlugin>;

        _instreamLayer.visible = false;
    }

    protected function setupLayer(name:String, index:Number):Sprite {
        var layer:Sprite = new Sprite();
        layer.name = name;
        this.addChildAt(layer, index);
        return layer;
    }

    protected function resizeMedia(width:Number, height:Number):void {
        // Don't need to resize the media if width/height are 0 (i.e. player is hidden in the DOM)
        if (width * height === 0) {
            return;
        }
        if (_mediaLayer.numChildren > 0 && _model.media.display) {
            if (_preserveAspect) {
                if (_model.fullscreen && _model.stretching === Stretcher.EXACTFIT) {
                    _model.media.resize(_normalScreen.width, _normalScreen.height);
                    Stretcher.stretch(_mediaLayer, width, height, Stretcher.UNIFORM);
                } else {
                    _model.media.resize(width, height);
                    _mediaLayer.scaleX = _mediaLayer.scaleY = 1;
                    _mediaLayer.x = _mediaLayer.y = 0;
                }
            } else {
                _model.media.resize(width, height);
                _mediaLayer.x = _mediaLayer.y = 0;
            }
        }
    }

    protected function resizeHandler(event:Event):void {
        var width:Number = RootReference.stage.stageWidth;
        var height:Number = RootReference.stage.stageHeight;
        var fullscreen:Boolean = (RootReference.stage.displayState === StageDisplayState.FULL_SCREEN);

        if (_model.fullscreen !== fullscreen) {
            _model.fullscreen = fullscreen;
        }
        if (width && height) {
            redraw();
        }
    }

    protected function mediaLoaded(evt:MediaEvent):void {
        var disp:DisplayObject = _model.media.display;
        if (!disp || disp.parent !== _mediaLayer) {
            while (_mediaLayer.numChildren) {
                _mediaLayer.removeChildAt(0);
            }
            if (disp) {
                _mediaLayer.addChild(disp);
                resizeMedia(_model.width, _model.height);
            }
        }
    }

}
}
