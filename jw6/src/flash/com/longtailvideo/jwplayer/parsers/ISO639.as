package com.longtailvideo.jwplayer.parsers {


    /** Mapping table for MP4 TimedText ISO639-2 language codec. **/
    public class ISO639 {
		
		private static const LANG_ARRAY:Array = [
			{label: "Chinese", mrss: "zh", tx3g: "zho"},
			{label: "Chinese", mrss: "zh", tx3g: "chi"},
			{label: "Dutch", mrss: "nl", tx3g: "dut"},
			{label: "Dutch", mrss: "nl", tx3g: "nld"},
			{label: "English", mrss: "en", tx3g: "eng"},
			{label: "French", mrss: "fr", tx3g: "fra"},
			{label: "French", mrss: "fr", tx3g: "fre"},
			{label: "German", mrss: "de", tx3g: "deu"},
			{label: "German", mrss: "de", tx3g: "ger"},
			{label: "Italian", mrss: "it", tx3g: "ita"},
			{label: "Japanese", mrss: "ja", tx3g: "jpn"},
			{label: "Portuguese", mrss: "pt", tx3g: "por"},
			{label: "Russian", mrss: "ru", tx3g: "rus"},
			{label: "Spanish", mrss: "es", tx3g: "spa"}
		];

        /** Get the name of a specific language code. **/
        public static function label(code:String):String { 
			for (var i:Number = 0; i < LANG_ARRAY.length; i++) {
				if(code == LANG_ARRAY[i].mrss || code == LANG_ARRAY[i].tx3g) {
					return LANG_ARRAY[i].label;
				}
			}
			return code;
        };


    };


}
