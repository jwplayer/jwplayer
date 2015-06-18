package com.longtailvideo.jwplayer.plugins {
import com.longtailvideo.jwplayer.utils.Utils;

public dynamic class PluginConfig {
    public function PluginConfig(pluginId:String, obj:Object = null) {
        this._id = pluginId.toLowerCase();
        Utils.extend(this, obj);
    }

    private var _id:String;

    public function get id():String {
        return _id;
    }

}
}