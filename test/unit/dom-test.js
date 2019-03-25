import {
    addClass,
    hasClass,
    removeClass,
    replaceClass,
    toggleClass,
    setAttribute,
    classList,
    styleDimension,
    createElement,
    replaceInnerHtml,
    emptyElement,
    empty,
    addStyleSheet,
    bounds,
    htmlToParentElement,
    sanitizeScriptNodes,
    sanitizeElementAttributes
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

    it('setAttribute', function() {
        const element = document.createElement('div');

        setAttribute(element, 'a', 'b');
        expect(element.getAttribute('a')).to.equal('b');

        setAttribute(element, 'a', 1);
        expect(element.getAttribute('a')).to.equal('1');
    });

    function verifyHtmlElement(element, tagName, id, childCount = 0) {
        expect(element.nodeType, `${element} is an HtmlElement`).to.equal(1);
        expect(element).to.have.property('tagName').which.equals(tagName);
        expect(element).to.have.property('id').which.equals(id);
        expect(element).to.have.property('childNodes').which.has.property('length').which.equals(childCount);
    }

    function listAttributeNames(element) {
        return Array.prototype.map.call(element.attributes, attr => attr.name);
    }

    describe('createElement', function() {
        it('Returns a new element based on HTML', function() {
            const element = createElement(`<div id="testid"></div>`);
            verifyHtmlElement(element, 'DIV', 'testid');
        });

        it('Returns only the first element', function() {
            const element = createElement(`<div id="d1"></div><div id="d2"></div>`);
            verifyHtmlElement(element, 'DIV', 'd1');
        });

        it('Sanitizes HTML input: XSS script, object and iframe elements', function() {
            const element = createElement(
                `<div>` +
                    `<script></script>` +
                    `<div id="firstChild"></div>` +
                    `<object></object>` +
                    `<div id="secondChild"></div>` +
                    `<iframe></iframe>` +
                `</div>`
            );
            verifyHtmlElement(element, 'DIV', '', 2);
            verifyHtmlElement(element.firstChild, 'DIV', 'firstChild');
            verifyHtmlElement(element.childNodes[1], 'DIV', 'secondChild');
        });

        it('Sanitizes HTML input: XSS img and svg attributes', function() {
            const element = createElement(
                `<div>` +
                    `<img id="firstChild" src="foobar" onerror="throw new Error('XSS image error attack')"></img>` +
                    `<svg id="secondChild" onload="throw new Error('XSS svg load attack')" data="ok" onwhatever="not allowed"></svg>` +
                `</div>`
            );
            const img = element.firstChild;
            const svg = element.childNodes[1];
            verifyHtmlElement(element, 'DIV', '', 2);
            verifyHtmlElement(img, 'IMG', 'firstChild');
            verifyHtmlElement(svg, 'svg', 'secondChild');

            expect(listAttributeNames(img)).to.include('id');
            expect(listAttributeNames(img)).to.include('src');
            expect(listAttributeNames(img)).to.not.include('onerror');
            expect(img.getAttribute('src')).to.contain('foobar');
            expect(img).to.have.property('attributes').which.has.property('length').which.equals(2);

            expect(listAttributeNames(svg)).to.include('id');
            expect(listAttributeNames(svg)).to.include('data');
            expect(listAttributeNames(svg)).to.not.include('onload');
            expect(listAttributeNames(svg)).to.not.include('onwhatever');
            expect(svg.getAttribute('data')).to.equal('ok');
            expect(svg).to.have.property('attributes').which.has.property('length').which.equals(2);
        });
    });

    describe('htmlToParentElement', function() {
        it('Returns a new parent element containing parsed HTML', function() {
            const body = htmlToParentElement(`<div id="firstChild"></div><div id="secondChild"></div>`);
            verifyHtmlElement(body, 'BODY', '', 2);
            verifyHtmlElement(body.firstChild, 'DIV', 'firstChild');
            verifyHtmlElement(body.childNodes[1], 'DIV', 'secondChild');
        });

        it('Sanitizes HTML input: XSS script, object and iframe elements', function() {
            const body = htmlToParentElement(
                `<script>a</script>` +
                `<object src="x">b</object>` +
                `<iframe src="y"></iframe>` +
                `<div id="onlyChild"></div>`
            );
            verifyHtmlElement(body, 'BODY', '', 1);
            verifyHtmlElement(body.firstChild, 'DIV', 'onlyChild');
        });

        it('Sanitizes HTML input: XSS img and svg attributes', function() {
            const body = htmlToParentElement(
                `<img id="firstChild" src="foobar" onerror="throw 'error'"></img>` +
                `<svg id="secondChild" onload="throw 'error'" data="ok" onerror="throw 'error'"></svg>`
            );
            const img = body.firstChild;
            const svg = body.childNodes[1];
            verifyHtmlElement(body, 'BODY', '', 2);
            verifyHtmlElement(img, 'IMG', 'firstChild');
            verifyHtmlElement(svg, 'svg', 'secondChild');

            expect(listAttributeNames(img)).to.include('id');
            expect(listAttributeNames(img)).to.include('src');
            expect(listAttributeNames(img)).to.not.include('onerror');
            expect(img.getAttribute('src')).to.contain('foobar');
            expect(img).to.have.property('attributes').which.has.property('length').which.equals(2);

            expect(listAttributeNames(svg)).to.include('id');
            expect(listAttributeNames(svg)).to.include('data');
            expect(listAttributeNames(svg)).to.not.include('onload');
            expect(listAttributeNames(svg)).to.not.include('onerror');
            expect(svg.getAttribute('data')).to.equal('ok');
            expect(svg).to.have.property('attributes').which.has.property('length').which.equals(2);
        });
    });

    describe('replaceInnerHtml', function() {
        it('Replaces an element\'s children with HTML', function() {
            const element = document.createElement('div');
            element.textContent = 'hello';
            element.appendChild(document.createElement('li'));

            replaceInnerHtml(element, `<div id="newChild"></div>`);
            verifyHtmlElement(element, 'DIV', '', 1);
            expect(element).to.have.property('textContent').which.equals('');
            verifyHtmlElement(element.firstChild, 'DIV', 'newChild');

            replaceInnerHtml(element, '');
            verifyHtmlElement(element, 'DIV', '', 0);
        });

        it('Replaces an element\'s children with text', function() {
            const element = document.createElement('div');
            element.textContent = 'hello';
            element.appendChild(document.createElement('li'));

            replaceInnerHtml(element, `world`);
            verifyHtmlElement(element, 'DIV', '', 1);
            expect(element).to.have.property('textContent').which.equals('world');

            replaceInnerHtml(element, '');
            verifyHtmlElement(element, 'DIV', '', 0);
            expect(element).to.have.property('textContent').which.equals('');
        });

        it('Sanitizes HTML input', function() {
            const element = document.createElement('div');
            element.textContent = 'hello';
            element.appendChild(document.createElement('li'));

            replaceInnerHtml(element,
                `hello` +
                `<script>a</script>` +
                `<object src="x">b</object>` +
                `<iframe src="y"></iframe>` +
                `<div id="onlyChild"></div>` +
                ` world` +
                `<img id="image" src="foobar" onerror="throw 'error'"></img>` +
                `<svg id="vector" data="ok" onerror="throw 'error'"></svg>`
            );
            verifyHtmlElement(element, 'DIV', '', 5);
            expect(element).to.have.property('textContent').which.equals('hello world');
            expect(element.childNodes[0].nodeType, `${element} is a TextElement`).to.equal(3);
            verifyHtmlElement(element.childNodes[1], 'DIV', 'onlyChild');
            expect(element.childNodes[2].nodeType, `${element} is a TextElement`).to.equal(3);
            verifyHtmlElement(element.childNodes[3], 'IMG', 'image');
            verifyHtmlElement(element.childNodes[4], 'svg', 'vector');
            expect(listAttributeNames(element.childNodes[3])).to.not.include('onerror');
            expect(listAttributeNames(element.childNodes[4])).to.not.include('onerror');
        });
    });

    describe('sanitizeScriptNodes', function() {
        it('Sanitizes HTML input: XSS script, object and iframe elements', function() {
            const parser = new DOMParser();
            const element = parser.parseFromString(
                `<div id="container">` +
                    `<iframe src="y"></iframe>` +
                    `<script>a</script>` +
                    `<object src="x">b</object>` +
                    `<div id="firstChild">hello</div>` +
                    `<script>c</script>` +
                    `<div id="secondChild">world</div>` +
                    `<object src="y">bye bye</object>` +
                `</div>`, 'text/html').body.firstChild;

            sanitizeScriptNodes(element);

            verifyHtmlElement(element, 'DIV', 'container', 2);
            verifyHtmlElement(element.firstChild, 'DIV', 'firstChild', 1);
            verifyHtmlElement(element.childNodes[1], 'DIV', 'secondChild', 1);
            expect(element).to.have.property('textContent').which.equals('helloworld');
        });
    });

    describe('sanitizeElementAttributes', function() {
        it('Removes attributes starting with "on" from element', function() {
            const parser = new DOMParser();
            const element = parser.parseFromString(
                `<div id="container" onload="throw 'error'" data="ok" onerror="throw 'error'" ondata src></div>`,
                'text/html').body.firstChild;

            sanitizeElementAttributes(element);

            verifyHtmlElement(element, 'DIV', 'container');

            expect(listAttributeNames(element)).to.include('id');
            expect(listAttributeNames(element)).to.include('data');
            expect(listAttributeNames(element)).to.include('src');
            expect(listAttributeNames(element)).to.not.include('onload');
            expect(listAttributeNames(element)).to.not.include('onerror');
            expect(listAttributeNames(element)).to.not.include('onany');
            expect(listAttributeNames(element)).to.not.include('ondata');
            expect(element.getAttribute('data')).to.equal('ok');
            expect(element).to.have.property('attributes').which.has.property('length').which.equals(3);
        });
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
