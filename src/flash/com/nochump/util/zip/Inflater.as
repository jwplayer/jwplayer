/*
nochump.util.zip.Inflater
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
	 * Inflater is used to decompress data that has been compressed according 
	 * to the "deflate" standard described in rfc1950.
	 *
	 * The usage is as following.  First you have to set some input with
	 * <code>setInput()</code>, then inflate() it.
	 * 
	 * This implementation is a port of Puff by Mark Addler that comes with
	 * the zlip data compression library.  It is not the fastest routine as
	 * he intended it for learning purposes, his actual optimized inflater code
	 * is very different.  I went with this approach basically because I got a
	 * headache looking at the optimized inflater code and porting this
	 * was a breeze.  The speed should be adequate but there is plenty of room
	 * for improvements here.
	 * 
	 * @author dchang
	 */
	public class Inflater {
		
		private static const MAXBITS:int = 15; // maximum bits in a code
		private static const MAXLCODES:int = 286; // maximum number of literal/length codes
		private static const MAXDCODES:int = 30; // maximum number of distance codes
		private static const MAXCODES:int = MAXLCODES + MAXDCODES; // maximum codes lengths to read
		private static const FIXLCODES:int = 288; // number of fixed literal/length codes
		// Size base for length codes 257..285
		private static const LENS:Array = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258];
		// Extra bits for length codes 257..285
		private static const LEXT:Array = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0];
		// Offset base for distance codes 0..29
		private static const DISTS:Array = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577];
		// Extra bits for distance codes 0..29
		private static const DEXT:Array = [ 0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13];

		private var inbuf:ByteArray; // input buffer
		private var incnt:uint; // bytes read so far
		private var bitbuf:int; // bit buffer
		private var bitcnt:int; // number of bits in bit buffer
		// Huffman code decoding tables
		private var lencode:Object;
		private var distcode:Object;
		
		/**
		 * Sets the input.
		 * 
		 * @param buf the input.
		 */
		public function setInput(buf:ByteArray):void {
			inbuf = buf;
			inbuf.endian = Endian.LITTLE_ENDIAN;
		}
		
		/**
		 * Inflates the compressed stream to the output buffer.
		 * 
		 * @param buf the output buffer.
		 */
		public function inflate(buf:ByteArray):uint {
			incnt = bitbuf = bitcnt = 0;
			var err:int = 0;
			do { // process blocks until last block or error
				var last:int = bits(1); // one if last block
				var type:int = bits(2); // block type 0..3
				//trace('	block type ' + type);
				if(type == 0) stored(buf); // uncompressed block
				else if(type == 3) throw new Error('invalid block type (type == 3)', -1);
				else { // compressed block
					lencode = {count:[], symbol:[]};
					distcode = {count:[], symbol:[]};
					if(type == 1) constructFixedTables();
					else if(type == 2) err = constructDynamicTables();
					if(err != 0) return err;
					err = codes(buf); // decode data until end-of-block code
				}
				if(err != 0) break; // return with error
			} while(!last);
			return err;
		}
		
		private function bits(need:int):int {
			// bit accumulator (can use up to 20 bits)
			// load at least need bits into val
			var val:int = bitbuf;
			while(bitcnt < need) {
				if (incnt == inbuf.length) throw new Error('available inflate data did not terminate', 2);
				val |= inbuf[incnt++] << bitcnt; // load eight bits
				bitcnt += 8;
			}
			// drop need bits and update buffer, always zero to seven bits left
			bitbuf = val >> need;
			bitcnt -= need;
			// return need bits, zeroing the bits above that
			return val & ((1 << need) - 1);
		}
		
		private function construct(h:Object, length:Array, n:int):int {
			var offs:Array = []; // offsets in symbol table for each length
			// count number of codes of each length
			for(var len:int = 0; len <= MAXBITS; len++) h.count[len] = 0;
			// assumes lengths are within bounds
			for(var symbol:int = 0; symbol < n; symbol++) h.count[length[symbol]]++;
			// no codes! complete, but decode() will fail
			if(h.count[0] == n) return 0;
			// check for an over-subscribed or incomplete set of lengths
			var left:int = 1; // one possible code of zero length
			for(len = 1; len <= MAXBITS; len++) {
				left <<= 1; // one more bit, double codes left
				left -= h.count[len]; // deduct count from possible codes
				if(left < 0) return left; // over-subscribed--return negative
			} // left > 0 means incomplete
			// generate offsets into symbol table for each length for sorting
			offs[1] = 0;
			for(len = 1; len < MAXBITS; len++) offs[len + 1] = offs[len] + h.count[len];
			// put symbols in table sorted by length, by symbol order within each length
			for(symbol = 0; symbol < n; symbol++)
				if(length[symbol] != 0) h.symbol[offs[length[symbol]]++] = symbol;
			// return zero for complete set, positive for incomplete set
			return left;
		}
		
		private function decode(h:Object):int {
			var code:int = 0; // len bits being decoded
			var first:int = 0; // first code of length len
			var index:int = 0; // index of first code of length len in symbol table
			for(var len:int = 1; len <= MAXBITS; len++) { // current number of bits in code
				code |= bits(1); // get next bit
				var count:int = h.count[len]; // number of codes of length len
				// if length len, return symbol
				if(code < first + count) return h.symbol[index + (code - first)];
				index += count; // else update for next length
				first += count;
				first <<= 1;
				code <<= 1;
			}
			return -9; // ran out of codes
		}
		
		private function codes(buf:ByteArray):int {
			// decode literals and length/distance pairs
			do {
				var symbol:int = decode(lencode);
				if(symbol < 0) return symbol; // invalid symbol
				if(symbol < 256) buf[buf.length] = symbol; // literal: symbol is the byte
				else if(symbol > 256) { // length
					// get and compute length
					symbol -= 257;
					if(symbol >= 29) throw new Error("invalid literal/length or distance code in fixed or dynamic block", -9);
					var len:int = LENS[symbol] + bits(LEXT[symbol]); // length for copy
					// get and check distance
					symbol = decode(distcode);
					if(symbol < 0) return symbol; // invalid symbol
					var dist:uint = DISTS[symbol] + bits(DEXT[symbol]); // distance for copy
					if(dist > buf.length) throw new Error("distance is too far back in fixed or dynamic block", -10);
					// copy length bytes from distance bytes back
					while(len--) buf[buf.length] = buf[buf.length - dist];
				}
			} while (symbol != 256); // end of block symbol
			return 0; // done with a valid fixed or dynamic block
		}
		
		private function stored(buf:ByteArray):void {
			// discard leftover bits from current byte (assumes s->bitcnt < 8)
			bitbuf = 0;
			bitcnt = 0;
			// get length and check against its one's complement
			if(incnt + 4 > inbuf.length) throw new Error('available inflate data did not terminate', 2);
			var len:uint = inbuf[incnt++]; // length of stored block
			len |= inbuf[incnt++] << 8;
			if(inbuf[incnt++] != (~len & 0xff) || inbuf[incnt++] != ((~len >> 8) & 0xff))
				throw new Error("stored block length did not match one's complement", -2);
			if(incnt + len > inbuf.length) throw new Error('available inflate data did not terminate', 2);
			while(len--) buf[buf.length] = inbuf[incnt++]; // copy len bytes from in to out
		}
		
		private function constructFixedTables():void {
			var lengths:Array = [];
			// literal/length table
			for(var symbol:int = 0; symbol < 144; symbol++) lengths[symbol] = 8;
			for(; symbol < 256; symbol++) lengths[symbol] = 9;
			for(; symbol < 280; symbol++) lengths[symbol] = 7;
			for(; symbol < FIXLCODES; symbol++) lengths[symbol] = 8;
			construct(lencode, lengths, FIXLCODES);
			// distance table
			for(symbol = 0; symbol < MAXDCODES; symbol++) lengths[symbol] = 5;
			construct(distcode, lengths, MAXDCODES);
		}
		
		private function constructDynamicTables():int {
			var lengths:Array = []; // descriptor code lengths
			// permutation of code length codes
			var order:Array = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
			// get number of lengths in each table, check lengths
			var nlen:int = bits(5) + 257;
			var ndist:int = bits(5) + 1;
			var ncode:int = bits(4) + 4; // number of lengths in descriptor
			if(nlen > MAXLCODES || ndist > MAXDCODES) throw new Error("dynamic block code description: too many length or distance codes", -3);
			// read code length code lengths (really), missing lengths are zero
			for(var index:int = 0; index < ncode; index++) lengths[order[index]] = bits(3);
			for(; index < 19; index++) lengths[order[index]] = 0;
			// build huffman table for code lengths codes (use lencode temporarily)
			var err:int = construct(lencode, lengths, 19);
			if(err != 0) throw new Error("dynamic block code description: code lengths codes incomplete", -4);
			// read length/literal and distance code length tables
			index = 0;
			while(index < nlen + ndist) {
				var symbol:int; // decoded value
				var len:int; // last length to repeat
				symbol = decode(lencode);
				if(symbol < 16) lengths[index++] = symbol; // length in 0..15
				else { // repeat instruction
					len = 0; // assume repeating zeros
					if(symbol == 16) { // repeat last length 3..6 times
						if(index == 0) throw new Error("dynamic block code description: repeat lengths with no first length", -5);
						len = lengths[index - 1]; // last length
						symbol = 3 + bits(2);
					}
					else if(symbol == 17) symbol = 3 + bits(3); // repeat zero 3..10 times
					else symbol = 11 + bits(7); // == 18, repeat zero 11..138 times
					if(index + symbol > nlen + ndist)
						throw new Error("dynamic block code description: repeat more than specified lengths", -6);
					while(symbol--) lengths[index++] = len; // repeat last or zero symbol times
				}
			}
			// build huffman table for literal/length codes
			err = construct(lencode, lengths, nlen);
			// only allow incomplete codes if just one code
			if(err < 0 || (err > 0 && nlen - lencode.count[0] != 1))
				throw new Error("dynamic block code description: invalid literal/length code lengths", -7);
			// build huffman table for distance codes
			err = construct(distcode, lengths.slice(nlen), ndist);
			// only allow incomplete codes if just one code
			if(err < 0 || (err > 0 && ndist - distcode.count[0] != 1))
				throw new Error("dynamic block code description: invalid distance code lengths", -8);
			return err;
		}
		
	}
	
}