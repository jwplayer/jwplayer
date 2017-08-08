import {
    addClass,
    hasClass,
    removeClass,
    replaceClass,
    toggleClass,
    classList,
    styleDimension,
    createElement,
    emptyElement,
    empty,
    addStyleSheet,
    bounds,
} from 'utils/dom';

describe('dom', function() {

    it('addClass', function() {
        var element = document.createElement('div');
        assert.strictEqual(element.className, '', 'Created an element with no classes');

        addClass(element, 'class1');
        assert.equal(element.className, 'class1', 'Added first class to element');

        addClass(element, 'class1');
        assert.equal(element.className, 'class1', 'Added same class to element');

        addClass(element, 'class2');
        assert.equal(element.className, 'class1 class2', 'Added second class to element');

        addClass(element, ['class3', 'class4']);
        assert.equal(element.className, 'class1 class2 class3 class4', 'Added array of classes to element');

        addClass(element, 'class5 class6');
        assert.equal(element.className, 'class1 class2 class3 class4 class5 class6',
            'Added space delimited classes to element');
    });

    it('removeClass', function() {
        var element = document.createElement('div');
        element.className = 'class1 class2 class3';
        assert.equal(element.className, 'class1 class2 class3', 'Created an element with two classes');

        removeClass(element, 'class3');
        assert.equal(element.className, 'class1 class2', 'Removed a class from element');

        removeClass(element, ['class2']);
        assert.equal(element.className, 'class1', 'Removed array of classes from element');

        removeClass(element, 'class1');
        assert.equal(element.className, '', 'Removed lass class from element');
    });


    it('replaceClass', function() {
        var element = document.createElement('div');

        replaceClass(element, /class0/, 'class1');
        assert.equal(element.className, 'class1', 'Adds class to element when pattern is not matched');

        element.className = 'class0';
        replaceClass(element, /class0/, 'class2');
        assert.equal(element.className, 'class2', 'Replaces class when pattern matches only class');


        element.className = 'class1 class2 class3';
        replaceClass(element, /class3/, 'class4');
        assert.equal(element.className, 'class1 class2 class4', 'Replaces classes when pattern matches any class');

        element.className = 'class1 class2 classB';
        replaceClass(element, /class\d/g, '');
        assert.equal(element.className, 'classB', 'Replaces classes when pattern matches any class');
    });

    it('createElement', function() {
        var element = createElement('<div id=\'testid\'></div>');

        assert.equal(element.id, 'testid', 'element create test');
    });

    it('styleDimension', function() {
        var percentage = styleDimension('50%');
        var px = styleDimension('50');

        // check style dimensions with percentage and px
        assert.equal(percentage, '50%', 'percentage dimension test');
        assert.equal(px, '50px', 'px dimension test');
    });

    it('classList', function() {
        var elementA = document.createElement('div');
        elementA.className = 'class1 class2';

        var elementB = document.createElement('div');
        addClass(elementB, 'a b');

        // get classList with both elements
        var classA = classList(elementA);
        var classB = classList(elementB);

        // check that the classList is what we expect
        assert.equal(classA[0], 'class1', 'first class add to class list');
        assert.equal(classA[1], 'class2', 'first class add to class list');
        assert.equal(classB[0], 'a', 'first class add to class name');
        assert.equal(classB[1], 'b', 'first class add to class name');

        // check that hasClass function works correctly
        assert.isOk(hasClass(elementA, 'class1'), 'has class test with existing class');
        assert.isNotOk(hasClass(elementA, 'class3'), 'has class test with non existing class');
    });

    it('toggleClass', function() {
        var element = document.createElement('div');
        addClass(element, 'a');

        // check toggleClass
        toggleClass(element, 'a');
        toggleClass(element, 'b');

        // check that b is added to element by toggle, and a is removed by toggle
        assert.isOk(hasClass(element, 'b'), 'has class test with toggle class');
        assert.isNotOk(hasClass(element, 'a'), 'has class test with removed class');
    });

    it('emptyElement', function() {
        var element = document.createElement('div');
        var child = document.createElement('p');

        // confirm that child is added to the element
        element.appendChild(child);
        assert.equal(element.firstChild, child);

        // empty the element and test that firstChild is not child anymore
        emptyElement(element);
        assert.isNotOk(element.firstChild, 'emptyElement should remove all children');

        // add child again to test empty
        element.appendChild(child);
        assert.equal(element.firstChild, child);

        // empty the children in element
        empty(element);
        assert.isNotOk(element.firstChild, 'empty should remove all children');

        // check empty with null will not break
        empty(null);
    });

    it.skip('addStyleSheet test', function() {
        var url = './data/playlist.json';
        addStyleSheet(url);

        // check that stylesheet with testUrl href has been added to the head
        assert.isOk(document.getElementsByTagName('head')[0].lastChild.href.indexOf('playlist') >= 0);
    });

    it.skip('bounds test', function() {
        var element = document.createElement('div');
        var emptyBound = { left: 0, right: 0, width: 0, height: 0, top: 0, bottom: 0 };

        // check null bounds does not break
        assert.deepEqual(bounds(null), emptyBound, 'bounds should be empty when element is not defined');

        assert.deepEqual(bounds(element), emptyBound, 'bounds should be empty when element is not in DOM');

        element.style.display = 'none';
        window.document.body.appendChild(element);
        assert.equal(bounds(element), emptyBound, 'bounds should be empty when element has no layout');

        element.style.display = 'block';
        element.style.width = '400px';
        element.style.height = '400px';
        assert.notEqual(bounds(element), emptyBound, 'bounds should not be empty when element has layout');
    });
});
