define([
    'utils/stretching'
], function (stretching) {
    /* jshint qunit: true */
    module('stretching');

    test('stretching.scale', function(assert) {
        var element = document.createElement('div');
        stretching.scale(element, 0, 0, 0, 0);

        assert.equal(element.style.transform, '', 'no transform is done');

        stretching.scale(element, 2, 2, 0, 0);
        assert.ok(/^scale\(2(,\s?2)?\)$/.test(element.style.transform), 'transform with scale');

        stretching.scale(element, 0, 0, 2, 2);
        assert.ok(/^translate\(2px,\s?2px\)$/.test(element.style.transform), 'transform with offset');

        stretching.scale(element, 2, 2, 2, 2);
        assert.ok(/^scale\(2(,\s?2)?\) translate\(2px,\s?2px\)$/.test(element.style.transform),
            'transform with scale and offset');
    });

    test('stretching.stretch invalid test', function(assert) {
        var element = document.createElement('div');
        var invalid = stretching.stretch('a', null , 1, 1, 1, 1);
        assert.notOk(invalid);

        invalid = stretching.stretch('a', element , null, 1, 1, 1);
        assert.notOk(invalid);

        invalid = stretching.stretch('a', element , 1, null, 1, 1);
        assert.notOk(invalid);

        invalid = stretching.stretch('a', element , 1, 1, null, 1);
        assert.notOk(invalid);

        invalid = stretching.stretch('a', element , 1, 1, 1, null);
        assert.notOk(invalid);
    });

    test('stretching.stretch with different stretch', function(assert) {
        var element = document.createElement('div');

        // uniform test
        var scale = stretching.stretch(null, element , 4, 2, 1, 1);
        assert.notOk(scale, 'uniform is not scaled');
        assert.equal(element.className, ' jw-stretch-uniform', 'uniform stretch should have uniform class');

        scale = stretching.stretch('uniform', element , 2, 4, 2, 1);
        assert.notOk(scale, 'uniform is not scaled');
        assert.equal(element.className, ' jw-stretch-uniform', 'uniform stretch should have uniform class');

        scale = stretching.stretch('uniform', element , 2, 4, 1, 2);
        assert.ok(scale, 'scaled with exactfit when yscale is bigger and exactfit matches');
        assert.equal(element.className, ' jw-stretch-exactfit', 'exactfit stretch should have exactfit class');

        scale = stretching.stretch('uniform', element , 4, 2, 2, 1.001);
        assert.ok(scale, 'scaled with exactfit when xscale is bigger and exactfit matches');
        assert.equal(element.className, ' jw-stretch-exactfit', 'exactfit stretch should have exactfit class');

        // fill test
        scale = stretching.stretch('fill', element , 2, 4, 2, 1);
        assert.ok(scale, 'fill is always scaled');
        assert.equal(element.className, ' jw-stretch-fill', 'fill stretch should have fill class');

        scale = stretching.stretch('fill', element , 4, 2, 1, 1);
        assert.ok(scale, 'fill is always scaled');
        assert.equal(element.className, ' jw-stretch-fill', 'fill stretch should have fill class');

        // non test
        scale = stretching.stretch('none', element , 4, 2, 1, 1);
        assert.ok(scale, 'none is always scaled');
        assert.equal(element.className, ' jw-stretch-none', 'none stretch should have none class');
    });

    test('stretching.stretch with video', function(assert) {
        var element = document.createElement('video');

        // parent width/height larger
        var scale = stretching.stretch('none', element, 4, 2, 1, 1);
        assert.ok(scale, 'none is always scaled');

        // get css text and remove spaces
        var text = element.style.cssText.replace(/\s+/g, '');
        assert.ok(text.indexOf('width:1px') >= 0,
            'parent larger element should have correct width scale');
        assert.ok(text.indexOf('height:1px') >= 0,
            'parent larger element should have correct height scale');

        // parent width/height smaller
        scale = stretching.stretch('none', element, 1, 1, 4, 2);
        text = element.style.cssText.replace(/\s+/g, '');
        assert.ok(scale, 'none is always scaled');
        assert.ok(text.indexOf('left:-1px') >= 0,
            'parent smaller element should have correct left stretch');
        assert.ok(text.indexOf('right:-1px') >= 0,
            'parent smaller element should have correct right stretch');
        assert.ok(text.indexOf('width:4px') >= 0,
            'parent smaller element should have correct width stretch');
        assert.ok(text.indexOf('height:2px') >= 0,
            'parent smaller element should have correct height stretch');

        // not scaled
        scale = stretching.stretch('uniform', element, 4, 2, 1, 1);
        assert.notOk(scale, 'uniform is always unscaled');
        assert.equal(element.style.transform, '', 'empty transform with video');
    });

});
