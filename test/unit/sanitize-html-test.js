import { replaceInnerHtml } from 'utils/dom';
import svgParse from 'utils/svgParser';

import sinon from 'sinon';

describe('Sanitize HTML', function () {
    const sandbox = sinon.createSandbox();
    const nestedHtml = '<svg xmlns=\"http://www.w3.org/2000/svg\" onload="console.log(\'baz\')"><script>console.log(document.domain)</script></svg>';
    let element;

    beforeEach(() => {
        element = document.createElement('div');
        sandbox.spy(console, 'log');
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('replaceInnerHtml', function () {
        it('should sanitize and append image tags', function () {
            const imageHtml = '<img src=foo onerror="console.log(\'bar\')">';
            replaceInnerHtml(element, imageHtml);
            expect(console.log).to.have.callCount(0);
            expect(element.firstChild.getAttribute('onerror')).to.equal(null);
        });

        it('should sanitize and add svg tags', function () {
            const svgHtml = '<svg xmlns="http://www.w3.org/2000/svg" onload="console.log(\'baz\')"/>';
            replaceInnerHtml(element, svgHtml);
            expect(console.log).to.have.callCount(0);
            expect(element.firstChild.getAttribute('onload')).to.equal(null);
        });

        it('should remove script tags', function () {
            const scriptHtml = '<script src="no.js" onerror="console.log(\'foobar\');"></script>';
            replaceInnerHtml(element, scriptHtml);
            expect(console.log).to.have.callCount(0);
            expect(element.firstChild).to.equal(null);
        });

        it('should not append if html is an empty string', function () {
            const empty = '';
            replaceInnerHtml(element, empty);
            expect(element.firstChild).to.equal(null);
        });

        it('should sanitize nested elements', function () {
            replaceInnerHtml(element, nestedHtml);
            const nestedElement = element.firstChild;
            expect(console.log).to.have.callCount(0);
            expect(nestedElement.getAttribute('onload')).to.equal(null);
            expect(nestedElement.firstChild).to.equal(null);
        });

        it('should sanitize any html element', function () {
            const divHtml = '<div onmouseover=console.log(document.domain)>foo</div>';
            replaceInnerHtml(element, divHtml);
            expect(console.log).to.have.callCount(0);
            expect(element.firstChild.getAttribute('onmouseover')).to.equal(null);
            expect(element.firstChild.textContent).to.equal('foo');
        });
    });

    describe('svgParse', function () {
        it('should sanitize nested elements in svg tag', function() {
            const svg = svgParse(nestedHtml);
            expect(console.log).to.have.callCount(0);
            expect(svg.getAttribute('onload')).to.equal(null);
            expect(svg.firstChild).to.equal(null);
        });
    });
});
