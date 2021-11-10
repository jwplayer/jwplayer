
const friendlyNames = {
    TIT2: 'title',
    TT2: 'title',
    WXXX: 'url',
    TPE1: 'artist',
    TP1: 'artist',
    TALB: 'album',
    TAL: 'album'
};

export function utf8ArrayToStr(array, startingIndex) {
    // Based on code by Masanao Izumo <iz@onicos.co.jp>
    // posted at http://www.onicos.com/staff/iz/amuse/javascript/expert/utf.txt

    const len = array.length;
    let c;
    let char2;
    let char3;
    let out = '';
    let i = startingIndex || 0;
    while (i < len) {
        c = array[i++];
        // If the character is 3 (END_OF_TEXT) or 0 (NULL) then skip it
        if (c === 0x00 || c === 0x03) {
            continue;
        }
        switch (c >> 4) {
            case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
            // 0xxxxxxx
                out += String.fromCharCode(c);
                break;
            case 12: case 13:
            // 110x xxxx   10xx xxxx
                char2 = array[i++];
                out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
                break;
            case 14:
                // 1110 xxxx  10xx xxxx  10xx xxxx
                char2 = array[i++];
                char3 = array[i++];
                out += String.fromCharCode(((c & 0x0F) << 12) |
                    ((char2 & 0x3F) << 6) |
                    ((char3 & 0x3F) << 0));
                break;
            default:
        }
    }
    return out;
}

function utf16BigEndianArrayToStr(array, startingIndex) {
    const lastDoubleByte = array.length - 1;
    let out = '';
    let i = startingIndex || 0;
    while (i < lastDoubleByte) {
        if (array[i] === 254 && array[i + 1] === 255) {
            // Byte order mark
        } else {
            out += String.fromCharCode((array[i] << 8) + array[i + 1]);
        }
        i += 2;
    }
    return out;
}
    
export function syncSafeInt(sizeArray) {
    const size = arrayToInt(sizeArray);
    return (size & 0x0000007F) |
        ((size & 0x00007F00) >> 1) |
        ((size & 0x007F0000) >> 2) |
        ((size & 0x7F000000) >> 3);
}

function arrayToInt(array) {
    let sizeString = '0x';
    for (let i = 0; i < array.length; i++) {
        if (array[i] < 16) {
            sizeString += '0';
        }
        sizeString += array[i].toString(16);
    }
    return parseInt(sizeString);
}
    
export function parseID3(activeCues = []) {
    return activeCues.reduce(function(data, cue) {
        if (!('value' in cue)) {
            // Cue is not in Safari's key/data format
            if ('data' in cue && cue.data instanceof ArrayBuffer) {
                // EdgeHTML 13.10586 cue point format - contains raw data in an ArrayBuffer.

                const oldCue = cue;
                const array = new Uint8Array(oldCue.data);
                let arrayLength = array.length;

                cue = { value: { key: '', data: '' } };

                let i = 10;
                while (i < 14 && i < array.length) {
                    if (array[i] === 0) {
                        break;
                    }
                    cue.value.key += String.fromCharCode(array[i]);
                    i++;
                }

                // If the first byte is 3 (END_OF_TEXT) or 0 (NULL) then skip it
                let startPos = 19;
                let firstByte = array[startPos];
                if (firstByte === 0x03 || firstByte === 0x00) {
                    firstByte = array[++startPos];
                    arrayLength--;
                }

                let infoDelimiterPosition = 0;
                // Find info/value pair delimiter if present.
                // If first byte shows theres utf 16 encoding, there is no info since info cannot be utf 16 encoded
                if (firstByte !== 0x01 && firstByte !== 0x02) {
                    for (let j = startPos + 1; j < arrayLength; j++) {
                        if (array[j] === 0x00) {
                            infoDelimiterPosition = j - startPos;
                            break;
                        }
                    }
                }

                if (infoDelimiterPosition > 0) {
                    const info = utf8ArrayToStr(array.subarray(startPos, startPos += infoDelimiterPosition), 0);
                    if (cue.value.key === 'PRIV') {
                        if (info === 'com.apple.streaming.transportStreamTimestamp') {
                            const ptsIs33Bit = syncSafeInt(array.subarray(startPos, startPos += 4)) & 0x00000001;
                            const transportStreamTimestamp = syncSafeInt(array.subarray(startPos, startPos += 4)) +
                                (ptsIs33Bit ? 0x100000000 : 0);
                            cue.value.data = transportStreamTimestamp;
                        } else {
                            cue.value.data = utf8ArrayToStr(array, startPos + 1);
                        }
                        cue.value.info = info;
                    } else {
                        cue.value.info = info;
                        cue.value.data = utf8ArrayToStr(array, startPos + 1);
                    }
                } else {
                    const encoding = array[startPos];
                    if (encoding === 1 || encoding === 2) {
                        cue.value.data = utf16BigEndianArrayToStr(array, startPos + 1);
                    } else {
                        cue.value.data = utf8ArrayToStr(array, startPos + 1);
                    }
                }
            }
        }

        // These friendly names mapping provides compatibility with our implementation prior to 7.3
        if (friendlyNames.hasOwnProperty(cue.value.key)) {
            data[friendlyNames[cue.value.key]] = cue.value.data;
        }
        /* The meta event includes a metadata object with flattened cue key/data pairs
         * If a cue also includes an info field, then create a collection of info/data pairs for the cue key
         *   TLEN: 03:50                                        // key: "TLEN", data: "03:50"
         *   WXXX: {"artworkURL":"http://domain.com/cover.jpg"} // key: "WXXX", info: "artworkURL" ...
         */
        if (cue.value.info) {
            let collection = data[cue.value.key];
            if (collection !== Object(collection)) {
                collection = {};
                data[cue.value.key] = collection;
            }
            collection[cue.value.info] = cue.value.data;
        } else {
            data[cue.value.key] = cue.value.data;
        }
        return data;
    }, {});
}
