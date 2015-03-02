package com.longtailvideo.jwplayer.model {

public dynamic class PlaylistItemTrack {

    /**
     * @param file - The location of the file to play
     * @param type - The type of file
     * @param def - Whether this level is the default selection
     * @param streamer - Item's RTMP stream location
     */
    public function PlaylistItemTrack(file:String, kind:String = "", def:Boolean = false, label:String = "") {
        this.file = file;
        this.kind = kind;
        this["default"] = def;
        this.label = label;
    }
    public var file:String = "";
    public var kind:String = "";
    public var label:String = "";

}
}