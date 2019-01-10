import { replaceInnerHtml } from 'utils/dom';
import sinon from 'sinon';

describe('replaceInnerHtml', function () {
    const sandbox = sinon.sandbox.create();
    let element;

    beforeEach(() => {
        element = document.createElement('div');
        sandbox.spy(console, 'log');
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should sanitize and append image tags', function() {
        const imageHtml = '<img src=foo onerror="console.log(\'bar\')">';
        replaceInnerHtml(element, imageHtml);
        expect(console.log).to.have.callCount(0);
        expect(element.firstChild.getAttribute('onerror')).to.equal(null);
    });

    it('should sanitizea and add svg tags', function() {
        const svgHtml = '<svg xmlns="http://www.w3.org/2000/svg" onload="console.log(\'baz\')"/>';
        replaceInnerHtml(element, svgHtml);
        expect(console.log).to.have.callCount(0);
        expect(element.firstChild.getAttribute('onload')).to.equal(null);
    });

    it('should remove script tags', function() {
        const scriptHtml = '<script src="no.js" onerror="console.log(\'foobar\');"></script>';
        replaceInnerHtml(element, scriptHtml);
        expect(console.log).to.have.callCount(0);
        expect(element.firstChild).to.equal(null);
    });

    it('should not append if html is an empty string', function() {
        const empty = '';
        replaceInnerHtml(element, empty);
        expect(element.firstChild).to.equal(null);
    });

});
