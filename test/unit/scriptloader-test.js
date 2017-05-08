define([
    'utils/scriptloader',
    'utils/parser'
], function (ScriptLoader, parser) {
    describe.skip('ScriptLoader', function() {

        var STATUS = {
            NEW: 0,
            LOADING: 1,
            ERROR: 2,
            COMPLETE: 3
        };

        it('ScriptLoader.getStatus', function() {
            // check status new
            var script = new ScriptLoader('./data/mp4.js', true);
            assert.equal(script.getStatus(), STATUS.NEW, 'newly created scriptloader has state new');

            script.load();
            assert.equal(script.getStatus(), STATUS.LOADING, 'loading script causes status to load');

            // loading again should not do anything
            script.load();
            assert.equal(script.getStatus(), STATUS.LOADING, 'loading script causes status to load');
        });

        it('ScriptLoader with style', function() {
            // check style tag true creates stylesheet
            var script = new ScriptLoader('./data/playlists.js', true);
            var tag = script.makeTag('styleTag');
            assert.isOk(tag.href.indexOf('styleTag') >= 0, 'makeTag with isStyle true creates style tag');
        });

        it('ScriptLoader with script', function() {
            var script = new ScriptLoader('./data/mixed.js', false);
            var tag = script.makeTag('scriptTag');
            script.load();

            assert.isOk(tag.src.indexOf('scriptTag') >= 0, 'makeTag with isStyle false creates script tag');
        });

        it('ScriptLoader load same script', function() {
            var script = new ScriptLoader('./data/mp4.js', false);
            script.load();

            // try to load a seconds script
            var script2 = new ScriptLoader('./data/mixed.js', false);
            script2.load();

            // try to load the same script
            var sameScript = new ScriptLoader('./data/playlists.js', false);
            sameScript.load();

            assert.isOk(document.getElementsByTagName('head')[0].firstChild.src.indexOf('playlists.js') >= 0,
                'adding same tag should not add the tag');
        });

        it('ScriptLoader with actual path', function() {
            var scriptPath = parser.getScriptPath('scriptloader-test.js') + 'scriptloader-test.js';
            var script = new ScriptLoader(scriptPath, false);
            script.load();

            // loaded script should be added to head as first child
            var tag = document.getElementsByTagName('head')[0].firstChild;
            assert.isOk(tag.src.indexOf('scriptloader-test.js') >= 0, 'script is laded properly');
        });
    });

});
