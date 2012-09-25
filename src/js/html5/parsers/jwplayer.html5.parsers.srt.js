(function(parsers) {


    /** Component that loads and parses an SRT file. **/
    parsers.srt = function(_success, _failure) {


        /** XMLHTTP Object. **/
        var _request,
        /** URL of the SRT file. **/
        _url,
        _seconds = jwplayer.utils.seconds;


        /** Handle errors. **/
        function _error(status) {
            if(status == 0) {
                _failure("Crossdomain loading denied: "+_url);
            } else if (status == 404) { 
                _failure("SRT File not found: "+_url);
            } else { 
                _failure("Error "+status+" loading SRT file: "+_url);
            }
        };


        /** Load a new SRT file. **/
        this.load = function(url) {
            _url = url;
            try {
                _request.open("GET", url, true);
                _request.send(null);
            } catch (error) {
                _failure("Error loading SRT File: "+url);
            }
        };


        /** Proceed from loading to parsing. **/
        function _parse(data) {
            // Trim whitespace and split the list by returns.
            var _captions = [{begin:0, text:''}];
            data = data.replace(/^\s+/, '').replace(/\s+$/, '');
            var list = data.split("\r\n\r\n");
            if(list.length == 1) { list = data.split("\n\n"); }
            for(var i=0; i<list.length; i++) {
                if (list[i] == "WEBVTT") {
                    continue;
                }
                // Parse each entry
                var entry = _entry(list[i]);
                if(entry['text']) {
                    _captions.push(entry);
                    // Insert empty caption at the end.
                    if(entry['end']) {
                        _captions.push({begin:entry['end'],text:''});
                        delete entry['end'];
                    }
                }
            }
            if(_captions.length > 1) {
                _success(_captions);
            } else {
                _failure("Invalid SRT file: "+_url);
            }
        };


        /** Parse a single captions entry. **/
        function _entry(data) {
            var entry = {};
            var array = data.split("\r\n");
            if(array.length == 1) { array = data.split("\n"); }
            try {
                // Second line contains the start and end.
                var idx = 1;
                if (array[0].indexOf(' --> ') > 0) {
                    idx = 0;
                }
                var index = array[idx].indexOf(' --> ');
                if(index > 0) {
                    entry['begin'] = _seconds(array[idx].substr(0,index));
                    entry['end'] = _seconds(array[idx].substr(index+5));
                }
                // Third line starts the text.
                if(array[idx+1]) {
                    entry['text'] = array[idx+1];
                    // Arbitrary number of additional lines.
                    for (var i=idx+2; i<array.length; i++) {
                        entry['text'] += '<br/>' + array[i];
                    }
                }
            } catch (error) {}
            return entry;
        };

        /** Setup the SRT parser. **/
        function _setup() {
            _request = new XMLHttpRequest();
            _request.onreadystatechange = function() {
                if (_request.readyState === 4) {
                    if (_request.status === 200) {
                        _parse(_request.responseText);
                    } else {
                        _error(_request.status);
                    }
                }
            };
        };
        _setup();


    };


})(jwplayer.html5.parsers);
