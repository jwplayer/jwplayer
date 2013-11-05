/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  Licensed under a Creative Creative Commons Attribution 3.0 Unported License                   */
/*                 without any warranty express or implied                                        */
/*               http://creativecommons.org/licenses/by/3.0/                                      */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */



/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  Block TEA (xxtea) Tiny Encryption Algorithm implementation in ActionScript                    */
/*     (c) Wowza Media Systems, Inc 2010: www.wowzamedia.com                                      */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */



/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  Block TEA (xxtea) Tiny Encryption Algorithm implementation in JavaScript                      */
/*     (c) Chris Veness 2002-2010: www.movable-type.co.uk/tea-block.html                          */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  Algorithm: David Wheeler & Roger Needham, Cambridge University Computer Lab                   */
/*             http://www.cl.cam.ac.uk/ftp/papers/djw-rmn/djw-rmn-tea.html (1994)                 */
/*             http://www.cl.cam.ac.uk/ftp/users/djw3/xtea.ps (1997)                              */
/*             http://www.cl.cam.ac.uk/ftp/users/djw3/xxtea.ps (1998)                             */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

package com.wowza.encryptionAS3 {

public class TEA {

	/*
	 * encrypt text using Corrected Block TEA (xxtea) algorithm
	 *
	 * @param {string} plaintext String to be encrypted (multi-byte safe)
	 * @param {string} password  Password to be used for encryption (1st 16 chars)
	 * @returns {string} encrypted text
	 */
	public static function encrypt(plaintext:String, password:String):String {
	    if (plaintext.length == 0) return "";  // nothing to encrypt

	    // convert string to array of longs after converting any multi-byte chars to UTF-8
	    var v:Array = charsToLongs(strToChars(plaintext));
	    if (v.length <= 1) v[1] = 0;  // algorithm doesn't work for n<2 so fudge by adding a null
	    // simply convert first 16 chars of password as key
	    var k:Array = charsToLongs(strToChars(password.substr(0, 16))); 
	    var n:Number = v.length;

	    // ---- <TEA coding> ----

	    var z:Number = v[n-1], y:Number = v[0], delta:Number = 0x9E3779B9;
	    var mx:Number, e:Number, q:Number = Math.floor(6 + 52/n), sum:Number = 0;

	    while (q-- > 0) {  // 6 + 52/n operations gives between 6 & 32 mixes on each word
		   sum += delta;
		   e = sum>>>2 & 3;
		   for (var p:Number = 0; p < n; p++) {
			  y = v[(p+1)%n];
			  mx = (z>>>5 ^ y<<2) + (y>>>3 ^ z<<4) ^ (sum^y) + (k[p&3 ^ e] ^ z);
			  z = v[p] += mx;
		   }
	    }

	    // ---- </TEA> ----

	    var ciphertext:Array = longsToChars(v);

	    return charsToHex(ciphertext);
	}	

	/*
	 * decrypt text using Corrected Block TEA (xxtea) algorithm
	 *
	 * @param {string} ciphertext String to be decrypted
	 * @param {string} password   Password to be used for decryption (1st 16 chars)
	 * @returns {string} decrypted text
	 */
	public static function decrypt(ciphertext:String, password:String):String {
	
	    if (ciphertext.length == 0) return "";
	    var v:Array = charsToLongs(hexToChars(ciphertext));
	    var k:Array = charsToLongs(strToChars(password.substr(0, 16)));
	    var n:Number = v.length;

	    // ---- <TEA decoding> ---- 

	    var z:Number = v[n-1], y:Number = v[0], delta:Number = 0x9E3779B9;
	    var mx:Number, e:Number, q:Number = Math.floor(6 + 52/n), sum:Number = q*delta;

	    while (sum != 0) {
		   e = sum>>>2 & 3;
		   for (var p:Number = n-1; p >= 0; p--) {
			  z = v[p>0 ? p-1 : n-1];
			  mx = (z>>>5 ^ y<<2) + (y>>>3 ^ z<<4) ^ (sum^y) + (k[p&3 ^ e] ^ z);
			  y = v[p] -= mx;
		   }
		   sum -= delta;
	    }

	    // ---- </TEA> ---- 

	    var plaintext:Array = longsToChars(v);

	    return charsToStr(plaintext);
	}
	
	/**
	* Private methods.
	*/
	private static function charsToLongs(chars:Array):Array {
		var temp:Array = new Array(Math.ceil(chars.length/4));
		for (var i:Number = 0; i<temp.length; i++) {
			temp[i] = chars[i*4] + (chars[i*4+1]<<8) + (chars[i*4+2]<<16) + (chars[i*4+3]<<24);
		}
		return temp;
	}
	
	private static function longsToChars(longs:Array):Array {
		var codes:Array = new Array();
		for (var i:Number = 0; i<longs.length; i++) {
			codes.push(longs[i] & 0xFF, longs[i]>>>8 & 0xFF, longs[i]>>>16 & 0xFF, longs[i]>>>24 & 0xFF);
		}
		return codes;
	}
	
	private static function longToChars(longs:Number):Array {
		var codes:Array = new Array();
		codes.push(longs & 0xFF, longs>>>8 & 0xFF, longs>>>16 & 0xFF, longs>>>24 & 0xFF);
		return codes;
	}
	
	private static function charsToHex(chars:Array):String {
		var result:String = new String("");
		var hexes:Array = new Array("0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f");
		for (var i:Number = 0; i<chars.length; i++) {
			result += hexes[chars[i] >> 4] + hexes[chars[i] & 0xf];
		}
		return result;
	}
	
	private static function hexToChars(hex:String):Array {
		var codes:Array = new Array();
		for (var i:Number = (hex.substr(0, 2) == "0x") ? 2 : 0; i<hex.length; i+=2) {
			codes.push(parseInt(hex.substr(i, 2), 16));
		}
		return codes;
	}
	
	private static function charsToStr(chars:Array):String {
		var result:String = new String("");
		for (var i:Number = 0; i<chars.length; i++) {
			result += String.fromCharCode(chars[i]);
		}
		return result;
	}
	
	private static function strToChars(str:String):Array {
		var codes:Array = new Array();
		for (var i:Number = 0; i<str.length; i++) {
			codes.push(str.charCodeAt(i));
		}
		return codes;
	}
	
}
}