package com.longtailvideo.jwplayer.plugins {
	/**
	 * All plugins loaded in the v6 player must implement the <code>IPlugin6</code> interface.
	 *  
	 * @author Pablo Schklowsky
	 */
	public interface IPlugin6 extends IPlugin {
		function get target():String;
	}
}