package com.longtailvideo.jwplayer {

import flash.display.Sprite;
import flash.events.Event;
import flash.external.ExternalInterface;
import flash.system.Security;

[SWF(width="640", height="360", frameRate="30", backgroundColor="#000000")]

public class FlashHealthCheck extends Sprite {

    public function FlashHealthCheck() {
        Security.allowDomain("*");
        this.tabEnabled = false;
        this.tabChildren = false;
        this.focusRect = false;
        this.buttonMode = false;
        notifyJavaScriptOfEmbed();
    }

    private function notifyJavaScriptOfEmbed(event:Event = null):void {
        if (ExternalInterface.available) {
            ExternalInterface.call(<script><![CDATA[
function(objectID) {
    var swf = document.getElementById(objectID);
    if (swf && typeof swf.embedCallback === 'function') {
        swf.embedCallback();
    }
}]]></script>, ExternalInterface.objectID);
        } else {
            this.removeEventListener(Event.ENTER_FRAME, notifyJavaScriptOfEmbed);
            this.addEventListener(Event.ENTER_FRAME, notifyJavaScriptOfEmbed);
        }
    }
}
}
