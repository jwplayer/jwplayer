define([
    'utils/strings'
], function(strings) {

    /** Component that loads and parses an DFXP file. **/

    var _seconds = strings.seconds;

    return function (xmlDoc) {
        validate(xmlDoc);
        var _captions = [];
        var paragraphs = xmlDoc.getElementsByTagName('p');
        validate(paragraphs);
        if (!paragraphs.length) {
            paragraphs = xmlDoc.getElementsByTagName('tt:p');
            if (!paragraphs.length) {
                paragraphs = xmlDoc.getElementsByTagName('tts:p');
            }
        }

        for (var i = 0; i < paragraphs.length; i++) {
            var p = paragraphs[i];
            var rawText = (p.innerHTML || p.textContent || p.text || '');
            var text = strings.trim(rawText).replace(/>\s+</g, '><').replace(/tts?:/g, '');
            if (text) {
                var begin = p.getAttribute('begin');
                var dur = p.getAttribute('dur');
                var end = p.getAttribute('end');

                var entry = {
                    begin: _seconds(begin),
                    text: text
                };
                if (end) {
                    entry.end = _seconds(end);
                } else if (dur) {
                    entry.end = entry.begin + _seconds(dur);
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
