(function(parsers) {


    /** Component that loads and parses an SRT file. **/
    parsers.srt = function() {


        /** XMLHTTP Object. **/
        var _utils = jwplayer.utils,
            _seconds = _utils.seconds;

        this.parse = function(data, mergeBeginEnd) {
            // Trim whitespace and split the list by returns.
            var _captions = mergeBeginEnd ? [] : [{
                begin: 0,
                text: ''
            }];
            data = _utils.trim(data);
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
            try {
                // Second line contains the start and end.
                var idx = 1;
                if (array[0].indexOf(' --> ') > 0) {
                    idx = 0;
                }
                var index = array[idx].indexOf(' --> ');
                if (index > 0) {
                    entry.begin = _seconds(array[idx].substr(0, index));
                    entry.end = _seconds(array[idx].substr(index + 5));
                }
                // Third line starts the text.
                if (array[idx + 1]) {
                    entry.text = array[idx + 1];
                    // Arbitrary number of additional lines.
                    for (var i = idx + 2; i < array.length; i++) {
                        entry.text += '<br/>' + array[i];
                    }
                }
            } catch (error) {}
            return entry;
        }

    };


})(jwplayer.parsers);
