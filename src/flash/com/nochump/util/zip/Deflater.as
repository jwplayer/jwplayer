/*
nochump.util.zip.Deflater
Copyright (c) 2008 David Chang (dchang@nochump.com)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
package com.nochump.util.zip {
	
	import flash.utils.Endian;
	import flash.utils.ByteArray;
	
	/**
	 * This is the Deflater class.  The deflater class compresses input
	 * with the deflate algorithm described in RFC 1951.  It uses the
	 * ByteArray compress method to deflate.
	 * 
	 * @author David Chang
	 */
	public class Deflater {
		
		private var buf:ByteArray;
		private var compressed:Boolean;
		private var totalIn:uint;
		private var totalOut:uint;
		
		/**
		 * Creates a new deflater.
		 */
		public function Deflater() {
			reset();
		}
		
		/** 
		 * Resets the deflater.  The deflater acts afterwards as if it was
		 * just created.
		 */
		public function reset():void {
			buf = new ByteArray();
			//buf.endian = Endian.LITTLE_ENDIAN;
			compressed = false;
			totalOut = totalIn = 0;
		}
		
		/**
		 * Sets the data which should be compressed next.
		 * 
		 * @param input the buffer containing the input data.
		 */
		public function setInput(input:ByteArray):void {
			buf.writeBytes(input);
			totalIn = buf.length;
		}
		
		/**
		 * Deflates the current input block to the given array.
		 * 
		 * @param output the buffer where to write the compressed data.
		 */
		public function deflate(output:ByteArray):uint {
			if(!compressed) {
				buf.compress();
				compressed = true;
			}
			output.writeBytes(buf, 2, buf.length - 6); // remove 2-byte header and last 4-byte addler32 checksum
			totalOut = output.length;
			return 0;
		}
		
		/**
		 * Gets the number of input bytes.
		 */
		public function getBytesRead():uint {
			return totalIn;
		}
		
		/**
		 * Gets the number of output bytes.
		 */
		public function getBytesWritten():uint {
			return totalOut;
		}
		
	}
	
}