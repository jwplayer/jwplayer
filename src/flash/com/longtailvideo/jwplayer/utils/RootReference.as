package com.longtailvideo.jwplayer.utils {
import flash.display.DisplayObject;
import flash.display.Stage;

/**
 * Maintains a static reference to the stage and root of the application.
 */
public class RootReference {

    /** The root DisplayObject of the application.  **/
    private static var _root:DisplayObject;

    /** A reference to the stage. **/
    private static var _stage:Stage;

    public static function get root():DisplayObject {
        return _root;
    }

    public static function get stage():Stage {
        return _stage;
    }

    public static function init(displayObj:DisplayObject):void {
        _root  = displayObj.root;
        _stage = displayObj.stage;
    }
}
}