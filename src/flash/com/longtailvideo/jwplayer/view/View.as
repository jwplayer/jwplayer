package com.longtailvideo.jwplayer.view {
import com.longtailvideo.jwplayer.events.GlobalEventDispatcher;
import com.longtailvideo.jwplayer.events.MediaEvent;
import com.longtailvideo.jwplayer.events.PlayerEvent;
import com.longtailvideo.jwplayer.events.ViewEvent;
import com.longtailvideo.jwplayer.model.Model;
import com.longtailvideo.jwplayer.player.IInstreamPlayer;
import com.longtailvideo.jwplayer.plugins.IPlugin;
import com.longtailvideo.jwplayer.plugins.IPlugin6;
import com.longtailvideo.jwplayer.plugins.PluginConfig;
import com.longtailvideo.jwplayer.utils.Logger;
import com.longtailvideo.jwplayer.utils.RootReference;
import com.longtailvideo.jwplayer.utils.Stretcher;

import flash.display.DisplayObject;
import flash.display.MovieClip;
import flash.display.StageAlign;
import flash.display.StageDisplayState;
import flash.display.StageScaleMode;
import flash.events.ErrorEvent;
import flash.events.Event;
import flash.geom.Rectangle;
import flash.text.TextField;
import flash.text.TextFieldAutoSize;
import flash.text.TextFormat;
import flash.text.TextFormatAlign;
import flash.utils.setTimeout;

public class View extends GlobalEventDispatcher {
    public function View(model:Model) {
        _model = model;

        RootReference.stage.scaleMode = StageScaleMode.NO_SCALE;
        RootReference.stage.stage.align = StageAlign.TOP_LEFT;

        _root = new MovieClip();
        _root.tabIndex = 0;
        _root.focusRect = false;
        _normalScreen = new Rectangle(
                0,
                0,
                _model.width,
                _model.height
        );
    }
    protected var _root:MovieClip;
    protected var _model:Model;
    protected var _preserveAspect:Boolean = false;
    protected var _normalScreen:Rectangle;
    protected var _mediaLayer:MovieClip;
    protected var _componentsLayer:MovieClip;
    protected var _pluginsLayer:MovieClip;
    protected var _plugins:Object;

    // Indicates whether the instream player is being displayed
    protected var _allPlugins:Vector.<IPlugin>;
    protected var _instreamMode:Boolean = false;
    protected var _instreamPlayer:IInstreamPlayer;
    protected var _instreamLayer:MovieClip;
    protected var _instreamPlugin:IPlugin;

    public function setupView():void {
        RootReference.stage.addChildAt(_root, 0);

        _root.visible = false;

        setupLayers();

        RootReference.stage.addEventListener(Event.RESIZE, resizeHandler);

        _model.addEventListener(MediaEvent.JWPLAYER_MEDIA_LOADED, mediaLoaded);

        redraw();
    }

    public function completeView(isError:Boolean = false, errorMsg:String = ""):void {
        if (!isError) {
            _root.visible = true;
        } else {
            // Make this asynchronous; fixes an issue in IE9/Flash 11.4+
            setTimeout(function ():void {
                var errorMessage:TextField = new TextField();
                errorMessage.defaultTextFormat = new TextFormat("_sans", 15, 0xffffff, false, false, false, null, null, TextFormatAlign.CENTER);
                errorMessage.text = errorMsg.replace(":", ":\n");
                errorMessage.width = RootReference.stage.stageWidth - 300;
                errorMessage.height = errorMessage.textHeight + 10;
                errorMessage.autoSize = TextFieldAutoSize.CENTER;

                errorMessage.x = (RootReference.stage.stageWidth - errorMessage.textWidth) / 2;
                errorMessage.y = (RootReference.stage.stageHeight - errorMessage.textHeight) / 2;
                RootReference.stage.addChild(errorMessage);
            }, 0);
        }
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
            _normalScreen.width  = _model.width  = RootReference.stage.stageWidth;
            _normalScreen.height = _model.height = RootReference.stage.stageHeight;
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

        for each (var plug:IPlugin in _allPlugins) {
            var plugDisplay:DisplayObject = plug as DisplayObject;
            if (plug && plugDisplay) {
                var cfg:PluginConfig = _model.pluginConfig(plug.id);
                if (cfg['visible']) {
                    plugDisplay.visible = true;
                    plugDisplay.x = cfg['x'];
                    plugDisplay.y = cfg['y'];
                    try {
                        plug.resize(cfg.width, cfg.height);
                    } catch (e:Error) {
                        Logger.log("There was an error resizing plugin '" + plug.id + "': " + e.message);
                    }
                } else {
                    plugDisplay.visible = false;
                }
            }
        }

    }

    public function addPlugin(id:String, plugin:IPlugin):void {
        if (!(plugin is IPlugin6)) {
            throw new Error("Incompatible plugin version");
        }
        try {
            _allPlugins.push(plugin);
            var plugDO:DisplayObject = plugin as DisplayObject;
            if (!_plugins[id] && plugDO != null) {
                _plugins[id] = plugDO;
                _pluginsLayer.addChild(plugDO);
            }
            if (_model.pluginIds.indexOf(id) < 0) {
                _model.plugins += "," + id;
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

    public function getSafeRegion():Rectangle {
        return new Rectangle(
                0,
                0,
                _model.width,
                _model.height
        );
    }

    protected function setupLayers():void {
        var currentLayer:uint = 0;

        _mediaLayer = setupLayer("media", currentLayer++);
        _componentsLayer = setupLayer("components", currentLayer++);
        _pluginsLayer = setupLayer("plugins", currentLayer++);
        _instreamLayer = setupLayer("instream", currentLayer++);

        _plugins = {};
        _allPlugins = new Vector.<IPlugin>;

        _mediaLayer.alpha = 0;

        _instreamLayer.alpha = 0;
        _instreamLayer.visible = false;
    }

    protected function setupLayer(name:String, index:Number):MovieClip {
        var layer:MovieClip = new MovieClip();
        layer.name = name;
        _root.addChildAt(layer, index);
        return layer;
    }

    protected function resizeMedia(width:Number, height:Number):void {
        // Don't need to resize the media if width/height are 0 (i.e. player is hidden in the DOM)
        if (width * height === 0) {
            return;
        }
        if (_mediaLayer.numChildren > 0 && _model.media.display) {
            if (_preserveAspect && _model.media.stretchMedia) {
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
            dispatchEvent(new ViewEvent(ViewEvent.JWPLAYER_FULLSCREEN, width, height, fullscreen));
        }
        if (width && height) {
            redraw();
            dispatchEvent(new ViewEvent(ViewEvent.JWPLAYER_RESIZE, width, height, fullscreen));
        }
    }

    protected function mediaLoaded(evt:MediaEvent):void {
        var disp:DisplayObject = _model.media.display;
        if (!disp || disp.parent != _mediaLayer) {
            while (_mediaLayer.numChildren) {
                _mediaLayer.removeChildAt(0);
            }
            if (disp) {
                _mediaLayer.addChild(disp);
                resizeMedia(_model.width, _model.height);
            }
        }
    }

    protected function forward(evt:Event):void {
        if (evt is PlayerEvent)
            dispatchEvent(evt);
    }

}
}
