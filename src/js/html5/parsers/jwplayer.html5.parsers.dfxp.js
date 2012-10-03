(function(parsers) {


    /** Component that loads and parses an DFXP file. **/
    parsers.dfxp = function(_success, _failure) {

        /** XMLHTTP Object. **/
        var _request,
        /** URL of the DFXP file. **/
        _url,
        _seconds = jwplayer.utils.seconds;


        /** Handle errors. **/
        function _error(status) {
            if(status == 0) {
                _failure("Crossdomain loading denied: "+_url);
            } else if (status == 404) { 
                _failure("DFXP File not found: "+_url);
            } else { 
                _failure("Error "+status+" loading DFXP file: "+_url);
            }
        };


        /** Load a new DFXP file. **/
        this.load = function(url) {
            _url = url;
            try {
                _request.open("GET", url, true);
                _request.send(null);
            } catch (error) {
                _failure("Error loading DFXP File: "+url);
            }
        };

        /** Proceed from loading to parsing. **/
        function _parse(data) {
            var _captions = [{begin:0, text:''}];
            data = data.replace(/^\s+/, '').replace(/\s+$/, '');
            var list = data.split("</p>");
            var newlist = [];
            for (var i = 0; i < list.length; i++) {
                if (list[i].indexOf("<p") >= 0) {
                    list[i] = list[i].substr(list[i].indexOf("<p") + 2).replace(/^\s+/, '').replace(/\s+$/, '');
                    newlist.push(list[i]);
                }
            }
            list = newlist;
            for (i = 0; i < list.length; i++) {
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
                _failure("Invalid DFXP file: "+_url);
            }
        };


        /** Parse a single captions entry. **/
        function _entry(data) {
            var entry = {};
            try {
                var idx = data.indexOf("begin=\"");
                data = data.substr(idx + 7);
                idx = data.indexOf("\" end=\"");
                entry['begin'] = _seconds(data.substr(0, idx));
                data = data.substr(idx + 7);
                idx = data.indexOf("\">");
                entry['end'] = _seconds(data.substr(0, idx));
                data = data.substr(idx + 2);
                entry['text'] = data;
            } catch (error) {}
            return entry;
        };

        /** Setup the DFXP parser. **/
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
