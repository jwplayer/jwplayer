package com.longtailvideo.jwplayer.plugins {


public dynamic class PluginConfig {
    public function PluginConfig(pluginId:String, obj:Object = null) {
        this._id = pluginId.toLowerCase();
        if (obj) {
            for (var idx:String in obj) {
                this[idx] = obj[idx];
            }
        }
    }

    private var _id:String;

    public function get id():String {
        return _id;
    }

}
}