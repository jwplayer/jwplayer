(function(parsers) {

    /** Component that loads and parses an DFXP file. **/
    parsers.dfxp = function() {

        var _seconds = jwplayer.utils.seconds;

        this.parse = function(data) {
            var _captions = [{
                begin: 0,
                text: ''
            }];
            data = data.replace(/^\s+/, '').replace(/\s+$/, '');
            var list = data.split('</p>');
            var list2 = data.split('</tt:p>');
            var newlist = [];
            var i;
            for (i = 0; i < list.length; i++) {
                if (list[i].indexOf('<p') >= 0) {
                    list[i] = list[i].substr(list[i].indexOf('<p') + 2).replace(/^\s+/, '').replace(/\s+$/, '');
                    newlist.push(list[i]);
                }
            }
            for (i = 0; i < list2.length; i++) {
                if (list2[i].indexOf('<tt:p') >= 0) {
                    list2[i] = list2[i].substr(list2[i].indexOf('<tt:p') + 5).replace(/^\s+/, '').replace(/\s+$/, '');
                    newlist.push(list2[i]);
                }
            }
            list = newlist;

            for (i = 0; i < list.length; i++) {
                var entry = _entry(list[i]);
                if (entry.text) {
                    _captions.push(entry);
                    // Insert empty caption at the end.
                    if (entry.end) {
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
                    message: 'Invalid DFXP file:'
                };
            }
        };


        /** Parse a single captions entry. **/
        function _entry(data) {
            var entry = {};
            try {
                var idx = data.indexOf('begin=\"');
                data = data.substr(idx + 7);
                idx = data.indexOf('\" end=\"');
                entry.begin = _seconds(data.substr(0, idx));
                data = data.substr(idx + 7);
                idx = data.indexOf('\"');
                entry.end = _seconds(data.substr(0, idx));
                idx = data.indexOf('\">');
                data = data.substr(idx + 2);
                entry.text = data;
            } catch (error) {}
            return entry;
        }

    };


})(jwplayer.parsers);
