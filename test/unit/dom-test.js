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
        const element = document.createElement('div');
        expect(element.className, 'Created an element with no classes').to.equal('');

        addClass(element, 'class1');
        expect(element.className, 'Added first class to element').to.equal('class1');

        addClass(element, 'class1');
        expect(element.className, 'Added same class to element').to.equal('class1');

        addClass(element, 'class2');
        expect(element.className, 'Added second class to element').to.equal('class1 class2');

        addClass(element, ['class3', 'class4']);
        expect(element.className, 'Added array of classes to element').to.equal('class1 class2 class3 class4');

        addClass(element, 'class5 class6');
        expect(element.className, 'Added space delimited classes to element').to.equal('class1 class2 class3 class4 class5 class6');
    });

    it('removeClass', function() {
        const element = document.createElement('div');
        element.className = 'class1 class2 class3';
        expect(element.className, 'Created an element with two classes').to.equal('class1 class2 class3');

        removeClass(element, 'class3');
        expect(element.className, 'Removed a class from element').to.equal('class1 class2');

        removeClass(element, ['class2']);
        expect(element.className, 'Removed array of classes from element').to.equal('class1');

        removeClass(element, 'class1');
        expect(element.className, 'Removed lass class from element').to.equal('');
    });


    it('replaceClass', function() {
        const element = document.createElement('div');

        replaceClass(element, /class0/, 'class1');
        expect(element.className, 'Adds class to element when pattern is not matched').to.equal('class1');

        element.className = 'class0';
        replaceClass(element, /class0/, 'class2');
        expect(element.className, 'Replaces class when pattern matches only class').to.equal('class2');


        element.className = 'class1 class2 class3';
        replaceClass(element, /class3/, 'class4');
        expect(element.className, 'Replaces classes when pattern matches any class').to.equal('class1 class2 class4');

        element.className = 'class1 class2 classB';
        replaceClass(element, /class\d/g, '');
        expect(element.className, 'Replaces classes when pattern matches any class').to.equal('classB');
    });

    it('createElement', function() {
        const element = createElement('<div id=\'testid\'></div>');

        expect(element.id, 'element create test').to.equal('testid');
    });

    it('styleDimension', function() {
        expect(styleDimension('100%')).to.equal('100%');
        expect(styleDimension('100')).to.equal('100px');
        expect(styleDimension(100)).to.equal('100px');

        // These should be supported, but currently are not
        // expect(styleDimension('100px')).to.equal('100px');
        // expect(styleDimension(0)).to.equal('0');
    });

    it('classList', function() {
        const elementA = document.createElement('div');
        elementA.className = 'class1 class2';

        const elementB = document.createElement('div');
        addClass(elementB, 'a b');

        // get classList with both elements
        const classA = classList(elementA);
        const classB = classList(elementB);

        // check that the classList is what we expect
        expect(classA[0], 'first class add to class list').to.equal('class1');
        expect(classA[1], 'first class add to class list').to.equal('class2');
        expect(classB[0], 'first class add to class name').to.equal('a');
        expect(classB[1], 'first class add to class name').to.equal('b');

        // check that hasClass function works correctly
        expect(hasClass(elementA, 'class1'), 'has class test with existing class').to.be.true;
        expect(hasClass(elementA, 'class3'), 'has class test with non existing class').to.be.false;
    });

    it('toggleClass', function() {
        const element = document.createElement('div');
        addClass(element, 'a');

        // check toggleClass
        toggleClass(element, 'a');
        toggleClass(element, 'b');

        // check that b is added to element by toggle, and a is removed by toggle
        expect(hasClass(element, 'b'), 'has class test with toggle class').to.be.true;
        expect(hasClass(element, 'a'), 'has class test with removed class').to.be.false;
    });

    it('emptyElement', function() {
        const element = document.createElement('div');
        const child = document.createElement('p');

        // confirm that child is added to the element
        element.appendChild(child);
        expect(element.firstChild).to.equal(child);

        // empty the element and test that firstChild is not child anymore
        emptyElement(element);
        expect(element.firstChild, 'emptyElement should remove all children').to.be.null;

        // add child again to test empty
        element.appendChild(child);
        expect(element.firstChild).to.equal(child);

        // empty the children in element
        empty(element);
        expect(element.firstChild, 'empty should remove all children').to.be.null;

        // check empty with null will not break
        empty(null);
    });

    it('addStyleSheet test', function() {
        const url = './data/playlist.json';
        addStyleSheet(url);

        // check that stylesheet with testUrl href has been added to the head
        expect(document.getElementsByTagName('head')[0].lastChild.href.indexOf('playlist') >= 0).to.be.true;
    });

    it('bounds test', function() {
        const element = document.createElement('div');
        const emptyBound = { left: 0, right: 0, width: 0, height: 0, top: 0, bottom: 0 };

        // check null bounds does not break
        expect(bounds(null), 'bounds should be empty when element is not defined').to.deep.equal(emptyBound);

        expect(bounds(element), 'bounds should be empty when element is not in DOM').to.deep.equal(emptyBound);

        element.style.display = 'none';
        window.document.body.appendChild(element);
        expect(bounds(element), 'bounds should be empty when element has no layout').to.deep.equal(emptyBound);

        element.style.display = 'block';
        element.style.width = '400px';
        element.style.height = '400px';
        expect('bounds should not be empty when element has layout').to.not.equal(bounds(element), emptyBound);
    });
});
