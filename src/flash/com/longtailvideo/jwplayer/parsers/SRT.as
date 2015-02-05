package com.longtailvideo.jwplayer.parsers {


    import com.longtailvideo.jwplayer.utils.Strings;

    /** Parse an Subrip caption file and return an array of captions. **/
    public class SRT {
		

        /** Parse SRT captions string into an array. **/
        public static function parseCaptions(dat:String, mergeBeginEnd:Boolean=false, segmentStartTime:Number = Number.NaN):Array {
            var startTime:Number = 0;
            var arr:Array = mergeBeginEnd ? [] : [{begin:0,text:''}];
            // Trim whitespace and split the list by returns.
            dat = dat.replace(/^\s+/, '').replace(/\s+$/, '');
            var lst:Array = dat.split("\r\n\r\n");
            if(lst.length == 1) { lst = dat.split("\n\n"); }
            for(var i:uint=0; i<lst.length; i++) {
                var elt:String = lst[i];
                // Parse the caption
				if (elt.indexOf("WEBVTT") === 0) {
                    if (!isNaN(segmentStartTime) && elt.indexOf("X-TIMESTAMP-MAP") > 0) {
                        var kv:Array = elt.slice(elt.indexOf("X-TIMESTAMP-MAP")).split("=");
                        if(kv.length === 2) {
                            var key:String = kv[0];
                            var value:String = kv[1];
                            var map:Array = value.split(",");
                            for(var j:uint = 0; j < map.length; j++) {
                                var e:String = map[j];
                                if(e.indexOf(":") > 0) {
                                    var p:int = e.indexOf(":");
                                    var k:String = e.substring(0, p);
                                    var v:String = e.substring(p+1);
                                    if(k === "LOCAL") {
                                        var seconds:Number = Strings.seconds(v);
                                        startTime = segmentStartTime - seconds;
                                    }
                                }
                            }
                        }
                    }
				} else {
                    var obj:Object = parseCaption(  elt, startTime);
                    if(obj['text']) {
                        arr.push(obj);
                        // Insert empty caption at the end.
                        if(obj['end'] && !mergeBeginEnd) {
                            arr.push({begin:obj['end'],text:''});
                            delete obj['end'];
                        }
                    }
                }
            }
            return arr;
        }


        /** Parse a single captions entry. **/
        private static function parseCaption(dat:String, startTime:Number):Object {
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
                    obj['begin'] = Strings.seconds(arr[index].substr(0,idx)) + startTime;
                    obj['end'] = Strings.seconds(arr[index].substr(idx+5)) + startTime;
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
        }
    }
}
