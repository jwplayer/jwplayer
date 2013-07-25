package com.longtailvideo.jwplayer.parsers {


    import com.longtailvideo.jwplayer.utils.Strings;
    import com.longtailvideo.jwplayer.utils.Logger;


    /** Parse styling and contents of W3C Timed Text XML files. **/
    public class DFXP {


        /** Name of the main XMl node. **/
        public static const NAME:String = 'tt';


        /** Parse stylesheets from the head.
        public static function parseStyles(data:XML,defaults:Object):Object {
            var styles:Object = {};
            for each (var i:XML in data.children()) {
                if (i.localName() == "head" && i.children().length()) {
                    for each (var node:XML in i.children()[0].children()) {
                        if (node.localName() == 'style') {
                            // Set the defaults.
                            var rules:Object = {};
                            for(var rule:String in defaults) {
                                rules[rule] = defaults[rule];
                            }
                            // Loop through all attributes for overrides.
                            for each (var attrib:XML in node.attributes()) {
                                var name:String = attrib.name();
                                if (name.indexOf("::") > -1) {
                                    name = name.substring(name.indexOf("::") + 2);
                                }
                                rules[name] = attrib.toString();
                            }
                            // Save to listing
                            if (node.@id) {
                                styles[node.@id] = rules;
                            }
                        }
                    }
                }
            }
            return styles;
        };


        /** Parse captions from the TT XML, returning a list with {begin:Number,text:String} objects. **/
        public static function parseCaptions(data:XML,style:Object):Array {
            //var styles:Object = DFXP.parseStyles(data,style);
            var array:Array = new Array({begin:0,text:''});
            for each (var i:XML in data.children()) {
                if (i.localName() == "body") {
                    for each (var j:XML in i.children()) {
                        for each (var k:XML in j.children()) {
                            // Paragraphs are single captions. They live inside dividers.
                            if (k.localName() == 'p') {
                                var entry:Object = DFXP.parseCaption(k);
                                array.push(entry);
                                /** Amend global styling.
                                if(entry.style && styles[entry.style]) {
                                    entry.style = styles[entry.style];
                                } else { 
                                    entry.style = style;
                                }
                                // Convert inline styles to HTML.
                                while (entry.text.indexOf("<span") > -1) {
                                    entry.text = DFXP.parseSpan(entry.text,styles,entry.style);
                                } **/
                                // End with a new, empty caption, accounting for duration or end set.
                                if (entry['end']) {
                                    array.push({begin:entry['end'],text:''});
                                    delete entry['end'];
                                } else if (entry['dur']) {
                                    array.push({begin:entry['begin']+entry['dur'],text:''});
                                    delete entry['dur'];
                                }
                            }
                        }
                    }
                }
            }
            return array;
        };


        /** Parse a single captions entry. **/
        private static function parseCaption(data:XML):Object {
            var pattern:RegExp = /(\n)+/;
            var entry:Object = {
                begin:DFXP.parseTime(data.@begin),
                dur:DFXP.parseTime(data.@dur),
                end:DFXP.parseTime(data.@end),
                //style:data.@style.toString(),
                text:data.children().toXMLString().replace(/\n/g,' ')
            };
            return entry;
        };


        /** Convert a span entry into HTML.
        private static function parseSpan(text:String,styles:Object,defaults:Object):String {
            var rules:Object = {};
            var newtext:String = '';
            // Find the span bounds and convert to XML.
            var left:Number = text.indexOf("<span ");
            var right:Number = text.indexOf("</span>",left);
            if (left > -1 && right > -1) {
                var span:XML = new XML(text.substring(left,right+7));
                // Use style if defined, else set defaults.
                var style:String = span.@style;
                if(style && styles[style]) {
                    for(var i:String in styles[style]) { rules[i] = styles[style][i]; }
                } else {
                    for(var j:String in defaults) { rules[j] = defaults[j]; }
                }
                // Override style with inline declarations
                for each (var attrib:XML in span.@*) {
                    var name:String = attrib.localName().toString();
                    if (rules[name]) {
                        rules[name] = attrib.toString();
                    }
                }
                // Wrap plain text with font and b/i/u tags.
                newtext = '<font family="'+rules.fontFamily+'" size="'+rules.fontSize+'" color="'+rules.color+'">';
                newtext +=  text.substring(text.indexOf('>',left)+1, right);
                newtext += "</font>";
                if(rules.fontWeight == 'bold') { newtext = '<b>'+newtext+'</b>'; }
                if(rules.fontStyle == 'italic') { newtext = '<i>'+newtext+'</i>'; }
                if(rules.textDecoration == 'underline') { newtext = '<u>'+newtext+'</u>'; }
            }
            return text.substr(0,left)+newtext+text.substr(right+7);
        }; **/


        public static function parseTime(str:String):Number {
            str = str.replace(',', '.');
            var arr:Array = str.split(':');
            var sec:Number = 0;
            if (str.substr(-2) == 'ms') {
                sec = Number(str.substr(0, str.length - 2)) / 1000;
            } else if (str.substr(-1) == 's') {
                    sec = Number(str.substr(0, str.length - 1));
            } else if (str.substr(-1) == 'm') {
                sec = Number(str.substr(0, str.length - 1)) * 60;
            } else if (str.substr(-1) == 'h') {
                sec = Number(str.substr(0, str.length - 1)) * 3600;
            } else if (arr.length > 1) {
                sec = Number(arr[arr.length - 1]);
                sec += Number(arr[arr.length - 2]) * 60;
                if (arr.length == 3) {
                    sec += Number(arr[arr.length - 3]) * 3600;
                }
            } else {
                sec = Number(str);
            }
            return sec;
        }



    }


}
