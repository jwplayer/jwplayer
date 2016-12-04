define([
    'utils/strings'
], function(strings) {

    /** Component that loads and parses an DFXP file. **/

    var _seconds = strings.seconds;

    return function (xmlDoc) {
        validate(xmlDoc);
        var _captions = [];
        var paragraphs = xmlDoc.getElementsByTagName('p');
        // Default frameRate is 30
        var frameRate = 30;
        var tt = xmlDoc.getElementsByTagName('tt');
        if (tt && tt[0]) {
            var parsedFrameRate = parseFloat(tt[0].getAttribute('ttp:frameRate'));
            if (!isNaN(parsedFrameRate)) {
                frameRate = parsedFrameRate;
            }
        }
        validate(paragraphs);
        if (!paragraphs.length) {
            paragraphs = xmlDoc.getElementsByTagName('tt:p');
            if (!paragraphs.length) {
                paragraphs = xmlDoc.getElementsByTagName('tts:p');
            }
        }

        for (var i = 0; i < paragraphs.length; i++) {
            var p = paragraphs[i];

            var breaks = p.getElementsByTagName('br');
            for (var j = 0; j < breaks.length; j++) {
                var b = breaks[j];
                b.parentNode.replaceChild(xmlDoc.createTextNode('\r\n'), b);
            }

            var rawText = (p.innerHTML || p.textContent || p.text || '');
            var text = strings.trim(rawText).replace(/>\s+</g, '><').replace(/(<\/?)tts?:/g, '$1').replace(/<br.*?\/>/g, '\r\n');
            if (text) {
                var begin = p.getAttribute('begin');
                var dur = p.getAttribute('dur');
                var end = p.getAttribute('end');

                var entry = {
                    begin: _seconds(begin, frameRate),
                    text: text
                };
                if (end) {
                    entry.end = _seconds(end, frameRate);
                } else if (dur) {
                    entry.end = entry.begin + _seconds(dur, frameRate);
                }
                _captions.push(entry);
            }
        }
        if (!_captions.length) {
            parseError();
        }
        return _captions;
    };

    function validate(object) {
        if (!object) {
            parseError();
        }
    }

    function parseError() {
        throw new Error('Invalid DFXP file');
    }
});
