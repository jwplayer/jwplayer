package com.longtailvideo.jwplayer.events {
import flash.events.IEventDispatcher;

public interface IGlobalEventDispatcher extends IEventDispatcher {
    /**
     * Adds a listener which will be called on any event dispatch
     */
    function addGlobalListener(listener:Function):void;

    /**
     * Remove a callback added via addGlobalListener()
     */
    function removeGlobalListener(listener:Function):void;
}
}