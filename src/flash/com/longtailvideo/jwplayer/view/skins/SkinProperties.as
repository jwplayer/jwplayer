package com.longtailvideo.jwplayer.view.skins {
	/**
	 * Typed public vars for skin-specific player options 
 	 */
	public dynamic class SkinProperties {
		
		public var layout:Object = {}
		
		public var version:String = "";
		public var name:String = "";
		public var author:String = "";
			
		public function SkinProperties() {
			this['backcolor']	= undefined;
			this['frontcolor']	= undefined;
			this['screencolor']	= undefined;
			this['lightcolor']	= undefined;
		}
	}
}