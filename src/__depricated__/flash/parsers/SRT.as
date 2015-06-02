package com.longtailvideo.jwplayer.parsers {


import com.longtailvideo.jwplayer.utils.Strings;

/** Parse an Subrip caption file and return an array of captions. **/
    public class SRT {

        /** Parse SRT captions string into an array. **/
        public static function parseCaptions(dat:String, mergeBeginEnd:Boolean=false):Array {
            var blocks:Array = getTextBlocks(dat);
            return blocksToCaptions(blocks, mergeBeginEnd);
        }

        /** Trim whitespace and split the list by returns. **/
        public static function getTextBlocks(dat:String):Array {
            dat = dat.replace(/^\s+/, '').replace(/\s+$/, '');
            var blocks:Array = dat.split("\r\n\r\n");
            if (blocks.length == 1) {
                blocks = dat.split("\n\n");
            }
            return blocks;
        }

        public static function blocksToCaptions(blocks:Array, mergeBeginEnd:Boolean=false):Array {
            var arr:Array = mergeBeginEnd ? [] : [{begin: 0, text: ''}];
            for(var i:uint=0; i<blocks.length; i++) {
                var block:String = blocks[i];
                // Parse the caption
                var obj:Object = parseCaption(block);
                if(obj.text) {
                    arr.push(obj);
                    // Insert empty caption at the end.
                    if(obj.end && !mergeBeginEnd) {
                        arr.push({begin: obj.end, text: ''});
                        delete obj.end;
                    }
                }
            }
            return arr;
        }

        /** Parse a single captions entry. **/
        private static function parseCaption(block:String):Object {
            var obj:Object = new Object();
            var lines:Array = block.split("\r\n");
            if (lines.length == 1) {
                lines = block.split("\n");
            }
            try {
				var index:Number = 1;
				if (lines[0].indexOf(' --> ') > 0) {
					index = 0;
				}
                // First line contains the start and end.
                var idx:Number = lines[index].indexOf(' --> ');
                if(idx > 0) {
                    obj.begin = Strings.seconds(lines[index].substr(0, idx));
                    obj.end   = Strings.seconds(lines[index].substr(idx + 5));
                }
                // Second line starts the text.
                if(lines[index+1]) {
                    obj.text = lines[index+1];
                    // Arbitrary number of additional lines.
                    for (var i:Number = index+2; i < lines.length; i++) {
                        obj.text += '<br/>' + lines[i];
                    }
                }
            } catch (err:Error) {}
            return obj;
        }
    }
}
