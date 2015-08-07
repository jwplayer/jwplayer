/**
 * Simple class that handles stretching of displayelements.
 **/
package com.longtailvideo.jwplayer.utils {

import flash.display.DisplayObject;

public class Stretcher {

    /** Stretches the clip nonuniform to fit the container. **/
    public static var EXACTFIT:String = "exactfit";
    /** Stretches the clip uniform to fill the container, with parts being cut off. **/
    public static var FILL:String = "fill";
    /** No stretching, but the clip is placed in the center of the container. **/
    public static var NONE:String = "none";
    /** Stretches the clip uniform to fit the container, with bars added. **/
    public static var UNIFORM:String = "uniform";

    /**
     * Resize a displayobject to the display, depending on the stretching.
     *
     * @param clp    The display element to resize.
     * @param parentWidth    The target width.
     * @param parentHeight    The target height.
     * @param typ    The stretching type.
     **/
    public static function stretch(clp:DisplayObject, parentWidth:Number, parentHeight:Number, typ:String = 'uniform'):void {
        clp.scaleX = clp.scaleY = 1;
        var elementWidth:Number = clp.width;
        var elementHeight:Number = clp.height;
        var xscale:Number = parentWidth / elementWidth;
        var yscale:Number = parentHeight / elementHeight;
        switch (typ.toLowerCase()) {
            case Stretcher.NONE:
                break;
            case Stretcher.EXACTFIT:
                clp.width  = parentWidth;
                clp.height = parentHeight;
                break;
            case Stretcher.FILL:
                if (xscale > yscale) {
                    clp.width  *= xscale;
                    clp.height *= xscale;
                } else {
                    clp.width  *= yscale;
                    clp.height *= yscale;
                }
                break;
            case Stretcher.UNIFORM:
            default:
                if (xscale > yscale) {
                    clp.width *= yscale;
                    clp.height *= yscale;
                    if (clp.width / parentWidth > 0.95) {
                        clp.width = parentWidth;
                    }
                } else {
                    clp.width *= xscale;
                    clp.height *= xscale;
                    if (clp.height / parentHeight > 0.95) {
                        clp.height = parentHeight;
                    }
                }
                break;
        }
        if (clp.width ) {
            clp.width = Math.ceil(clp.width);
            clp.x = Math.round((parentWidth - clp.width) / 2);
        }
        if (clp.height) {
            clp.y = Math.round((parentHeight - clp.height) / 2);
            clp.height = Math.ceil(clp.height);
        }
    }

}

}