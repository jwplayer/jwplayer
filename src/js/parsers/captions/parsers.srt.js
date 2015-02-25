define([
    'utils/helpers',
    'utils/strings'
], function(utils, strings) {

    /** Component that loads and parses an SRT file. **/
    var srt = function () {

        /** XMLHTTP Object. **/
        var _seconds = utils.seconds;

        this.parse = function (data, mergeBeginEnd) {
            // Trim whitespace and split the list by returns.
            var _captions = mergeBeginEnd ? [] : [
                {
                    begin: 0,
                    text: ''
                }
            ];
            data = strings.trim(data);
            var list = data.split('\r\n\r\n');
            if (list.length === 1) {
                list = data.split('\n\n');
            }
            for (var i = 0; i < list.length; i++) {
                if (list[i] === 'WEBVTT') {
                    continue;
                }
                // Parse each entry
                var entry = _entry(list[i]);
                if (entry.text) {
                    _captions.push(entry);
                    // Insert empty caption at the end.
                    if (entry.end && !mergeBeginEnd) {
                        _captions.push({
                            begin: entry.end,
                            text: ''
                        });
                        delete entry.end;
                    }
                }
            }
            if (_captions.length > 1) {
                return _captions;
            } else {
                throw {
                    message: 'Invalid SRT file'
                };
            }
        };


        /** Parse a single captions entry. **/
        function _entry(data) {
            var entry = {};
            var array = data.split('\r\n');
            if (array.length === 1) {
                array = data.split('\n');
            }
            var idx = 1;
            if (array[0].indexOf(' --> ') > 0) {
                idx = 0;
            }
            if (array.length > idx + 1 && array[idx + 1]) {
                // Second line contains the start and end.
                var line = array[idx];
                var index = line.indexOf(' --> ');
                if (index > 0) {
                    entry.begin = _seconds(line.substr(0, index));
                    entry.end = _seconds(line.substr(index + 5));
                    // Third line starts the text.
                    entry.text = array[++idx];
                    // Arbitrary number of additional lines.
                    while (++idx < array.length) {
                        entry.text += '<br/>' + array[idx];
                    }
                }

            }
            return entry;
        }

    };

    return srt;
});
