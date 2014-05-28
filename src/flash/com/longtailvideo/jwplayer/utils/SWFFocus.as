
/*
* Copyright (c) 2008 Michael A. Jordan
* Copyright (c) 2009 Adobe Systems, Inc.
* All rights reserved.
* 
* Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
* 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
* 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
* 3. Neither the name of the copyright holders nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.
* 
* THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

package com.longtailvideo.jwplayer.utils
{
	import flash.display.DisplayObject;
	import flash.display.InteractiveObject;
	import flash.display.Stage;
	import flash.events.Event;
	import flash.events.EventDispatcher;
	import flash.events.FocusEvent;
	import flash.external.ExternalInterface;
	import flash.system.Capabilities;
	
	
	/**
	 *  SWFFocus intends to solve a keyboard accessibility related problem that 
	 *  occurs on browsers other than Internet Explorer. 
	 
	 *  <p>The problem is that it is impossible for keyboard users to move focus 
	 *  into an embedded Flash movie, and once focus is inside the Flash content 
	 *  it is impossible to move it back to the HTML content without a mouse.</p>
	 *  <p>This class injects JavaScript into the document embedding the Flash 
	 *  movie. This script  makes it possible to tab into the Flash movie. 
	 *  Additionally, SWFFocus monitors changes in focus, and will send focus back 
	 *  to the HTML content when a focus wrap is about to occur. This should allow 
	 *  keybaord users to both tab into and out of embedded Flash content.</p>
	 */
	public class SWFFocus extends EventDispatcher 
	{
		private static var _availability:Boolean = ExternalInterface.available;
		private static var _dispatcher:EventDispatcher = new EventDispatcher();
		private static var _instance:SWFFocus = new SWFFocus( SingletonLock );
		private static var _initialized:Boolean = false;
		private var _stage:Stage;
		private var _idPrev:String;
		private var _idNext:String;
		private var _lastFocus:InteractiveObject;
		private var _flagActivated:Boolean = false;
		
		//--------------------------------------------------------------------------
		//
		//  Constructor
		//
		//--------------------------------------------------------------------------
		public function SWFFocus( lock:Class )
		{
			if ( lock != SingletonLock )   
			{   
				throw new Error( "Invalid Singleton access. Use SWFFocus.init." );   
			}
		}
		
		/**
		 *  
		 *  Initiates swffocus object, and sets callbacks
		 */
		public static function init(stageRef:Stage):void 
		{
			var swffocus:SWFFocus = _instance;
			if (stageRef && swffocus._stage != stageRef && !_initialized)
			{
				swffocus._stage = stageRef;
				_initialized =  swffocus._initialize();
			}
		};
		
		/**
		 *@private  
		 *  Set event handles and inject JavaScript code
		 */
		private function _initialize():Boolean 
		{
			
			if (_availability && Capabilities.playerType.toLowerCase() == "plugin" && !SWFFocus._initialized) {
				ExternalInterface.addCallback("SWFsetFocusIds", _instance.setFocusIds);
				
				_stage.addEventListener(FocusEvent.FOCUS_OUT, stage_handleFocusChange, false, 0, true);
				_stage.addEventListener(FocusEvent.KEY_FOCUS_CHANGE, stage_handleKeyFocusChange, false, 0, true);
				_stage.addEventListener(Event.ACTIVATE, stage_onActivateEvent, false, 1, true);
				_stage.addEventListener(Event.DEACTIVATE, stage_onActivateEvent, false, 1, true);
				
				/*
				The ExternalInterface call executes the following anonymous javascript function
				to create links and script functions to handle focus into and out of swf.
				
				function()
				{
				window.blurredSwfId='';
				
				var i,j,k,oE,o,pE,p,st,ti,a,d,s,t,cN,pId,nId,rpId,rnId;
				var wk = RegExp(' AppleWebKit/').test(navigator.userAgent) && RegExp('Mac').test(navigator.platform);
				
				if(wk)
				{
				var linkFocusHandler = function(event)
				{
				if(!event.target.getAttribute) return;
				var rs = event.target.getAttribute('data-related-swf');
				var rl = event.target.getAttribute('data-related-link');
				if(window.blurredSwfId!=rs)
				{
				document.getElementById(rs).focus();
				}else if(rl)
				{
				document.getElementById(rl).focus();
				}
				window.blurredSwfId='';
				};
				
				var swfBlurHandler = function(event)
				{
				if(!event.target.id) return;
				window.blurredSwfId=event.target.id;
				};
				
				var swfFocusHandler = function(event)
				{
				window.blurredSwfId='';
				};
				
				};
				
				oE=document.getElementsByTagName('object');
				
				if(oE.length==0)
				{
				oE=document.getElementsByTagName('embed');
				};
				
				s='border:0;clip:rect(0 0 0 0);display:block;height:1px;margin:-1px;outline:none;overflow:hidden;padding:0;position:absolute;width:1px;';
				
				for(i=0;i<oE.length;i++)
				{
				o=oE[i];
				
				if((o.data||o.src) 
				&& o.type=='application/x-shockwave-flash')
				{
				st=true;
				pE=o.getElementsByTagName('param');
				
				for(j=0;j<pE.length;j++)
				{
				p=pE[j];
				if(p.name.toLowerCase()=='seamlesstabbing')
				{
				if(p.value.toLowerCase()=='false')
				{
				st=false;
				}
				break;
				}
				};
				
				if(o.tagName.toLowerCase()=='embed')
				{
				if(o.attributes['seamlesstabbing'] 
				&& o.attributes['seamlesstabbing'].value.toLowerCase()=='false')
				{
				st=false;
				}else
				{
				o.setAttribute('seamlesstabbing','true');
				}
				};
				
				if(st)
				{
				if(!o.id || o.id.length<=0)
				{
				o.id='SWFFocusTarget'+i;
				};
				
				o.setAttribute('name',o.id);
				pId=nId='';
				cN=o.className.split(' ');
				for(k=0;k<cN.length;k++)
				{
				if(cN[k].indexOf('swfNext-')!=-1)
				{
				nId=cN[k].substr(8);
				} else if(cN[k].indexOf('swfPrev-')!=-1)
				{
				pId=cN[k].substr(8);
				}
				};
				
				if(pId==''||(pId!=''&&wk))
				{
				o.className=o.className.replace(/(?:\s)?swfPrev-(?:\S+)?(?:\s)?/g,'');
				rpId=pId;
				pId='beforeswfanchor'+i;
				
				if(!document.getElementById(pId))
				{
				a=document.createElement('a');
				a.id=pId;
				a.href='#'+o.id;
				a.setAttribute('tabindex',(wk?0:-1));
				a.title='Flash start';
				a.setAttribute('style',s);
				
				if(wk)
				{
				if(rpId!='') a.setAttribute('data-related-link',rpId);
				a.setAttribute('data-related-swf',o.id);
				a.addEventListener('focus',linkFocusHandler);
				};
				
				o.parentNode.insertBefore(a,o);
				o.className+=' swfPrev-'+pId;
				}
				};
				
				if(nId==''||(nId!=''&&wk))
				{
				o.className=o.className.replace(/(?:\s)?swfNext-(?:\S+)?(?:\s)?/g,'');
				rnId=nId;
				nId='afterswfanchor'+i;
				
				if(!document.getElementById(nId))
				{
				a=document.createElement('a');
				a.id=nId;
				a.href='#'+o.id;
				a.setAttribute('tabindex',(wk?0:-1));
				a.title='Flash end';
				a.setAttribute('style',s);
				
				if(wk)
				{
				if(rnId!='') a.setAttribute('data-related-link',rnId);
				a.setAttribute('data-related-swf',o.id);
				a.addEventListener('focus',linkFocusHandler);
				};
				
				o.parentNode.insertBefore(a,o.nextSibling);
				o.className+=' swfNext-'+nId;
				}
				};
				
				o.SWFsetFocusIds(pId,nId);
				
				if(o.getAttribute('tabindex')<=0)
				{
				o.setAttribute('tabindex',0);
				};
				
				if(wk)
				{
				o.addEventListener('blur',swfBlurHandler);
				o.addEventListener('focus',swfFocusHandler);
				};
				}
				}
				}
				}
				*/                
				ExternalInterface.call("function()" +
					"{" +
					"window.blurredSwfId='';"+
					
					"var i,j,k,oE,o,pE,p,st,ti,a,d,s,t,cN,pId,nId,rpId,rnId;" +
					"var wk = RegExp(' AppleWebKit/').test(navigator.userAgent) && RegExp('Mac').test(navigator.platform);" +
					
					"if(wk)" +
					"{" +
					"var linkFocusHandler = function(event)" +
					"{" +
					"if(!event.target.getAttribute) return;" +
					"var rs = event.target.getAttribute('data-related-swf');" +
					"var rl = event.target.getAttribute('data-related-link');" +
					"if(window.blurredSwfId!=rs)" +
					"{" +
					"document.getElementById(rs).focus();" +
					"}else if(rl)" +
					"{" +
					"    document.getElementById(rl).focus();" +
					"}" +
					"window.blurredSwfId='';" +
					"};" +
					
					"var swfBlurHandler = function(event)" +
					"{" +
					"if(!event.target.id) return;" +
					"window.blurredSwfId=event.target.id;" +
					"};" +
					
					"var swfFocusHandler = function(event)" +
					"{" +
					"window.blurredSwfId='';" +
					"};" +
					
					"};" +
					
					"oE=document.getElementsByTagName('object');" +
					
					"if(oE.length==0)" +
					"{" +
					"oE=document.getElementsByTagName('embed');" +
					"};" +
					
					"s='border:0;" +
					"clip:rect(0 0 0 0);" +
					"display:block;" +
					"height:1px;" +
					"margin:-1px;" +
					"outline:none;" +
					"overflow:hidden;" +
					"padding:0;" +
					"position:absolute;" +
					"width:1px;';" +
					
					"for(i=0;i<oE.length;i++)" +
					"{" +
					"o=oE[i];" +
					
					"if((o.data||o.src) " +
					"&& o.type=='application/x-shockwave-flash')" +
					"{" +
					"st=true;" +
					"pE=o.getElementsByTagName('param');" +
					
					"for(j=0;j<pE.length;j++)" +
					"{" +
					"p=pE[j];" +
					"if(p.name.toLowerCase()=='seamlesstabbing')" +
					"{" +
					"if(p.value.toLowerCase()=='false')" +
					"{" +
					"st=false;" +
					"}" +
					"break;" +
					"}" +
					"};" +
					
					"if(o.tagName.toLowerCase()=='embed')" +
					"{" +
					"if(o.attributes['seamlesstabbing'] " +
					"&& o.attributes['seamlesstabbing'].value.toLowerCase()=='false')" +
					"{" +
					"st=false;" +
					"}else" +
					"{" +
					"o.setAttribute('seamlesstabbing','true');" +
					"}" +
					"};" +
					
					"if(st)" +
					"{" +
					"if(!o.id || o.id.length<=0)" +
					"{" +
					"o.id='SWFFocusTarget'+i;"+
					"};" +
					
					"o.setAttribute('name',o.id);" +
					"pId=nId='';" +
					"cN=o.className.split(' ');" +
					"for(k=0;k<cN.length;k++)" +
					"{" +
					"if(cN[k].indexOf('swfNext-')!=-1)" +
					"{" +
					"nId=cN[k].substr(8);" +
					"} else if(cN[k].indexOf('swfPrev-')!=-1)" +
					"{" +
					"pId=cN[k].substr(8);" +
					"}" +
					"};" +
					
					"if(pId==''||(pId!=''&&wk))" +
					"{" +
					"o.className=o.className.replace(/(?:\s)?swfPrev-(?:\S+)?(?:\s)?/g,'');" +
					"rpId=pId;" +
					"pId='beforeswfanchor'+i;" +
					
					"if(!document.getElementById(pId))" +
					"{" +
					"a=document.createElement('a');" +
					"a.id=pId;" +
					"a.href='#'+o.id;" +
					"a.setAttribute('tabindex',(wk?0:-1));" +
					"a.title='Flash start';" +
					"a.setAttribute('style',s);" +
					
					"if(wk)" +
					"{" +
					"if(rpId!='') a.setAttribute('data-related-link',rpId);" +
					"a.setAttribute('data-related-swf',o.id);"+
					"a.addEventListener('focus',linkFocusHandler);" +
					"};" +
					
					"o.parentNode.insertBefore(a,o);" +
					"o.className+=' swfPrev-'+pId;" +
					"}" +
					"};" +
					
					"if(nId==''||(nId!=''&&wk))" +
					"{" +
					"o.className=o.className.replace(/(?:\s)?swfNext-(?:\S+)?(?:\s)?/g,'');" +
					"rnId=nId;" +
					"nId='afterswfanchor'+i;" +
					
					"if(!document.getElementById(nId))" +
					"{" +
					"a=document.createElement('a');" +
					"a.id=nId;" +
					"a.href='#'+o.id;" +
					"a.setAttribute('tabindex',(wk?0:-1));" +
					"a.title='Flash end';" +
					"a.setAttribute('style',s);" +
					
					"if(wk)" +
					"{" +
					"if(rnId!='') a.setAttribute('data-related-link',rnId);" +
					"a.setAttribute('data-related-swf',o.id);"+
					"a.addEventListener('focus',linkFocusHandler);" +
					"};" +
					
					"o.parentNode.insertBefore(a,o.nextSibling);" +
					"o.className+=' swfNext-'+nId;" +
					"}" +
					"};" +
					
					"o.SWFsetFocusIds(pId,nId);" +
					
					"if(o.getAttribute('tabindex')<=0)" +
					"{" +
					"o.setAttribute('tabindex',0);" +
					"};" +
					
					"if(wk)" +
					"{" +
					"o.addEventListener('blur',swfBlurHandler);" +
					"o.addEventListener('focus',swfFocusHandler);" +
					"};" +
					"}" +
					"}" +
					"}" +
					"}");
			}
			return true;
		}
		
		/**
		 *  @private
		 *  Allow tracing in both browser and Flash debugger
		 */
		private function eTrace(msg:String):void 
		{
			eCall("function() {if (console) console.log('" + msg +"')}");
			trace(msg);
		}
		
		/**
		 *  @private
		 *  Quick method for ExternalInterface calls
		 */
		private function eCall(functionCall:String):void
		{
			if(_availability && Capabilities.playerType.toLowerCase()  == "plugin") 
				ExternalInterface.call(functionCall);
			
		}
		
		/**
		 *  @private
		 *  Monitors changes in focus, moves focus back to HTML if a focus wrap occurred
		 */        
		private function stage_handleKeyFocusChange(e:FocusEvent):void 
		{    
			var oldFocus:InteractiveObject = e.target as InteractiveObject;
			var newFocus:InteractiveObject = e.relatedObject;
			if (newFocus && oldFocus) _lastFocus = e.relatedObject;
			if (!_flagActivated)
			{
				if (oldFocus.tabIndex == newFocus.tabIndex) {
					// eTrace("wrap occurred: " + _idNext);
					e.preventDefault();
					eCall("function(){var elem = document.getElementById('"+ (e.shiftKey ? _idPrev : _idNext) +"'); if (elem) elem.focus();}");
				}
			} else
			{
				_flagActivated = false;
			}
		}
		
		/**
		 *  @private
		 *  Compares two Flash elements to dermine whether a focus wrap occurred or not
		 */                
			private function wrapOccurred(oldFocus:InteractiveObject, newFocus:InteractiveObject, goingBackwards:Boolean):Boolean 
		{
			var focusIndex1:String = "";
			var focusIndex2:String = "";
			var index:int;
			var tmp:String = "";
			var tmp2:String = "";
			var zeros:String = "0000";
			var result:Boolean = false;
			var a:DisplayObject = DisplayObject(oldFocus);
			var b:DisplayObject = DisplayObject(newFocus);
			var aa:int = oldFocus.tabIndex;
			var bb:int = newFocus.tabIndex;
			
			eTrace( "called wrapOccurred, {oldFocus.tabIndex:"+oldFocus.tabIndex+", newFocus.tabIndex:"+newFocus.tabIndex+", goingBackwards: "+goingBackwards+"}");
			if (aa == bb) 
			{
				// tabindex not explicitly set, or set to the same value. 
				// Use childindex to determine which element comes before the other instead
				while (a != _stage && a.parent)
				{
					index = a.parent.getChildIndex(a);
					tmp = index.toString(16);
					if (tmp.length < 4)
					{
						tmp2 = zeros.substring(0, 4 - tmp.length) + tmp;
					}
					focusIndex1 = tmp2 + focusIndex1;
					a = a.parent;
				}
				
				while (b != _stage && b.parent)
				{
					index = b.parent.getChildIndex(b);
					tmp = index.toString(16);
					if (tmp.length < 4)
					{
						tmp2 = zeros.substring(0, 4 - tmp.length) + tmp;
					}
					focusIndex2 = tmp2 + focusIndex2;
					b = b.parent;
				}
				result = !goingBackwards ? focusIndex1 > focusIndex2 : focusIndex1 < focusIndex2;
				if(!result 
					&& goingBackwards 
					&& (focusIndex1 > focusIndex2 
						&& focusIndex2.replace(/0{4}/g,"").length==0))
					result = true;
				
				eTrace( "\twrapOccurred=("+result+") tabIndex NOT explicitly set {oldFocusIndex:"+focusIndex1+", newFocusIndex:"+focusIndex2+"}");
			}
			else 
			{
				// tabindex explicitly set
				result = !goingBackwards ? aa > bb : aa < bb;
				
				if (aa==-1 || bb==-1)
					result = false;
				
				eTrace( "\twrapOccurred=("+result+") tabIndex explicitly set {oldTabIndex:"+aa+", newTabIndex:"+bb+"}");
			}
			return result;
		}
		
		/**
		 *  @private stores the last target focus;
		 */
		private function stage_handleFocusChange(e:FocusEvent):void {
			if (e.relatedObject) _lastFocus = e.relatedObject;
		}
		
		/**
		 *  
		 *  Callback function for JavaScript, to be called when the Flash movie object is focused in HTML
		 */
		private function stage_onActivateEvent(e:Event):void
		{    
			//trace("stage: Event." + e.type.toUpperCase() + " ");
			if (_lastFocus) _stage.focus = null;
			switch(e.type){
				case Event.ACTIVATE :
					_flagActivated = true;
					break;
				case Event.DEACTIVATE :
					_flagActivated = false;
					break;
			}
		}
		
		/**
		 *  
		 *  Callback function for JavaScript, used to set IDs of next and previous 
		 *  elements in the HTML tab order
		 */
		public function setFocusIds(idPrev:String, idNext:String):void 
		{
			if (idPrev)
				_idPrev = idPrev;
			if (idNext)
				_idNext = idNext;
			
			// eTrace("setFocusIds("+_idPrev+", "+_idNext+")");
		}
		
		/**
		 *  
		 *  Callback function for JavaScript, used to get IDs of next and previous 
		 *  elements in the HTML tab order
		 */
		public function getFocusIds():String 
		{
			var ids:Array = [];
			if (_idPrev)
				ids.push(_idPrev);
			if (_idNext)
				ids.push(_idNext);
			return ids.join(" ");
		}
	}
}

/**  
 * This is a private class declared outside of the package  
 * that is only accessible to classes inside of the SWFFocus.as  
 * file.  Because of that, no outside code is able to get a  
 * reference to this class to pass to the constructor, which  
 * enables us to prevent outside instantiation.  
 */  
class SingletonLock
{   
} // end class  