/*
nochump.util.zip.CRC32
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
	
	import flash.utils.ByteArray;
	
	/**
	 * Computes CRC32 data checksum of a data stream.
	 * The actual CRC32 algorithm is described in RFC 1952
	 * (GZIP file format specification version 4.3).
	 * 
	 * @author David Chang
	 * @date January 2, 2007.
	 */
	public class CRC32 {
		
		/** The crc data checksum so far. */
		private var crc:uint;
		
		/** The fast CRC table. Computed once when the CRC32 class is loaded. */
		private static var crcTable:Array = makeCrcTable();
		
		/** Make the table for a fast CRC. */
		private static function makeCrcTable():Array {
			var crcTable:Array = new Array(256);
			for (var n:int = 0; n < 256; n++) {
				var c:uint = n;
				for (var k:int = 8; --k >= 0; ) {
					if((c & 1) != 0) c = 0xedb88320 ^ (c >>> 1);
					else c = c >>> 1;
				}
				crcTable[n] = c;
			}
			return crcTable;
		}
		
		/**
		 * Returns the CRC32 data checksum computed so far.
		 */
		public function getValue():uint {
			return crc & 0xffffffff;
		}
		
		/**
		 * Resets the CRC32 data checksum as if no update was ever called.
		 */
		public function reset():void {
			crc = 0;
		}
		
		/**
		 * Adds the complete byte array to the data checksum.
		 * 
		 * @param buf the buffer which contains the data
		 */
		public function update(buf:ByteArray):void {
			var off:uint = 0;
			var len:uint = buf.length;
			var c:uint = ~crc;
			while(--len >= 0) c = crcTable[(c ^ buf[off++]) & 0xff] ^ (c >>> 8);
			crc = ~c;
		}
		
	}
	
}
