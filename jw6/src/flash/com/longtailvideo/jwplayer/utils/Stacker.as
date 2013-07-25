package com.longtailvideo.jwplayer.utils {
    import flash.display.DisplayObject;
    import flash.display.InteractiveObject;
    import flash.display.MovieClip;
    import flash.display.Sprite;

    public class Stacker {
        /** Reference to the clip to stack. **/
        public var clip:MovieClip;
        /** SWF skin loader reference **/
        private var stack:Array;
        /** Original width of the clip. **/
        private var _width:Number;
        /** Latest width of the clip. **/
        private var latest:Number = 0;

        /**
         * Constructor.
         *
         * @param clp	The MovieClip to manage.
         **/
        public function Stacker(clp:MovieClip):void {
			if (clp is MovieClip) {
	            clip = clp;
    	        analyze();
			} else {
				throw new TypeError("Expecting a MovieClip");
			}
        }

        /** Analyze the MovieClip and save its children. **/
        private function analyze():void {
            _width = clip.width;
            stack = new Array();
            for (var i:Number = 0; i < clip.numChildren; i++) {
                var clp:DisplayObject = clip.getChildAt(i);
                stack.push({c: clp, x: clp.x, n: clp.name, w: clp.width, nr: clp.hasOwnProperty('stacker.noresize')});
            }
            stack.sortOn([ 'x', 'n' ], [ Array.NUMERIC, Array.CASEINSENSITIVE ]);
        }

        /** Check if an child overlaps with others. **/
        private function overlaps(idx:Number):Boolean {
            var min:Number = stack[idx].x;
            var max:Number = stack[idx].x + stack[idx].w;
            for (var i:Number = 0; i < stack.length; i++) {
                if (i != idx && stack[i].c.visible == true && stack[i].w < _width && stack[i].x < max && stack[i].x + stack[i].w > min) {
                    return true;
                }
            }
            return false;
        }

        /**
         * Rearrange the contents of the clip.
         *
         * @param wid	The target width of the clip.
         **/
        public function rearrange(wid:Number = undefined):void {
            if (wid) {
                latest = wid;
            }
            var rdf:Number = latest - width;
            var ldf:Number = 0;
            // first run through the entire stack, closing the gaps.
            for (var i:Number = 0; i < stack.length; i++) {
                if (stack[i].x > width / 2) {
                    stack[i].c.x = stack[i].x + rdf;
                    if (stack[i].c.visible == false && overlaps(i) == false) {
                        if (i < (stack.length - 1)) {
                            rdf -= stack[i].w + stack[i].x - stack[i - 1].x - stack[i - 1].w;
                        } else {
                            rdf -= stack[i].w + stack[i].x - stack[i - 1].x - stack[i - 1].w;
                        }
                    }
                } else {
                    stack[i].c.x = stack[i].x - ldf;
                    if (stack[i].c.visible == false && overlaps(i) == false) {
                        if (stack[i - 1].w > width / 4) {
                            ldf += stack[i].w + stack[i].x;
                        } else {
                            ldf += stack[i].w + stack[i].x - stack[i - 1].x - stack[i - 1].w;
                        }
                    }
                }
                if (stack[i].w > width / 4 && !stack[i].nr) {
                    stack[i].c.width = Math.abs(stack[i].w + rdf + ldf);
				} else if (stack[i].c is InteractiveObject) {				
					stack[i].c.tabIndex = i + 1;
				}
            }
            // if gaps were closed, move all rightside stuff to fill the width.
            var dif:Number = latest - width - rdf;
            if (dif > 0) {
                for (var j:Number = 0; j < stack.length; j++) {
                    if (stack[j].x > width / 2) {
                        stack[j].c.x += dif;
                    }
                    if (stack[j].w > width / 4 && stack[j].w < width) {
                        stack[j].c.width += dif;
                    }
                }
            }
        }

        /** Getter for the original width of the MC. **/
        public function get width():Number {
            return _width;
        }

        public function insert(clp:MovieClip, nxt:MovieClip):void {
            var fnd:Number = 0;
            for (var j:Number = 0; j < stack.length; j++) {
                if (stack[j].w >= _width) {
                    stack[j].w += clp.width;
                }
                if (stack[j].c == nxt && !fnd) {
                    fnd = j;
                    stack.splice(j, 0, {c: clp, x: stack[j].x, n: clp.name, w: clp.width});
                } else if (fnd) {
                    stack[j].x += clp.width;
                }
            }
            _width += clp.width;
            rearrange();
        }
    }
}