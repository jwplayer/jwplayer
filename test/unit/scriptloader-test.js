define([
    'utils/scriptloader',
    'utils/parser'
], function (scriptloader, parser) {
    /* jshint qunit: true */

    QUnit.module('scriptloader');
    var test = QUnit.test.bind(QUnit);

    var STATUS = {
        NEW: 0,
        LOADING: 1,
        ERROR: 2,
        COMPLETE: 3
    };

    test('scriptloader.getStatus', function(assert) {
        // check status new
        var script = new scriptloader(require.toUrl('./data/mp4.js'), true);
        assert.equal(script.getStatus(), STATUS.NEW, 'newly created scriptloader has state new');

        script.load();
        assert.equal(script.getStatus(), STATUS.LOADING, 'loading script causes status to load');

        // loading again should not do anything
        script.load();
        assert.equal(script.getStatus(), STATUS.LOADING, 'loading script causes status to load');
    });

    test('scriptloader with style', function(assert) {
        // check style tag true creates stylesheet
        var script = new scriptloader(require.toUrl('./data/playlists.js'), true);
        var tag = script.makeTag('styleTag');
        assert.ok(tag.href.indexOf('styleTag') >= 0, 'makeTag with isStyle true creates style tag');
    });

    test('scriptloader with script', function(assert) {
        var script = new scriptloader(require.toUrl('./data/mixed.js'), false);
        var tag = script.makeTag('scriptTag');
        script.load();

        assert.ok(tag.src.indexOf('scriptTag') >= 0, 'makeTag with isStyle false creates script tag');
    });

    test('scriptloader load same script', function(assert) {
        var script = new scriptloader(require.toUrl('./data/mp4.js'), false);
        script.load();

        // try to load a seconds script
        var script2 = new scriptloader(require.toUrl('./data/mixed.js'), false);
        script2.load();

        // try to load the same script
        var sameScript = new scriptloader(require.toUrl('./data/playlists.js'), false);
        sameScript.load();

        assert.ok(document.getElementsByTagName('head')[0].firstChild.src.indexOf('playlists.js') >= 0,
            'adding same tag should not add the tag');
    });

    test('scriptloader with actual path', function(assert) {
        var scriptPath = parser.getScriptPath('scriptloader-test.js') + 'scriptloader-test.js';
        var script = new scriptloader(scriptPath, false);
        script.load();

        // loaded script should be added to head as first child
        var tag = document.getElementsByTagName('head')[0].firstChild;
        assert.ok(tag.src.indexOf('scriptloader-test.js') >= 0, 'script is laded properly');
    });

});
