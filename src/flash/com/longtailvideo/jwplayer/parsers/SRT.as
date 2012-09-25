package com.longtailvideo.jwplayer.parsers {


    import com.longtailvideo.jwplayer.utils.Strings;

    /** Parse an Subrip caption file and return an array of captions. **/
    public class SRT {
		

        /** Parse SRT captions string into an array. **/
        public static function parseCaptions(dat:String):Array {
            var arr:Array = new Array({begin:0,text:''});
            // Trim whitespace and split the list by returns.
            dat = dat.replace(/^\s+/, '').replace(/\s+$/, '');
            var lst:Array = dat.split("\r\n\r\n");
            if(lst.length == 1) { lst = dat.split("\n\n"); }
            for(var i:Number=0; i<lst.length; i++) {
                // Parse the caption
				if (lst[i] == "WEBVTT") {
					continue;
				}
                var obj:Object = SRT.parseCaption(lst[i]);
                if(obj['text']) {
                    arr.push(obj);
                    // Insert empty caption at the end.
                    if(obj['end']) {
                        arr.push({begin:obj['end'],text:''});
                        delete obj['end'];
                    }
                }
            }
            return arr;
        };


        /** Parse a single captions entry. **/
        private static function parseCaption(dat:String):Object {
            var obj:Object = new Object();
            var arr:Array = dat.split("\r\n");
            if(arr.length == 1) { arr = dat.split("\n"); }
            try {
				var index:Number = 1;
				if (arr[0].indexOf(' --> ') > 0) {
					index = 0;
				}
                // First line contains the start and end.
                var idx:Number = arr[index].indexOf(' --> ');
                if(idx > 0) {
                    obj['begin'] = Strings.seconds(arr[index].substr(0,idx));
                    obj['end'] = Strings.seconds(arr[index].substr(idx+5));
                }
                // Second line starts the text.
                if(arr[index+1]) {
                    obj['text'] = arr[index+1];
                    // Arbitrary number of additional lines.
                    for (var i:Number = index+2; i < arr.length; i++) {
                        obj['text'] += '<br/>'+arr[i];
                    }
                }
            } catch (err:Error) {}
            return obj;
        };


    }


}