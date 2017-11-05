import {
    isChrome,
    isFacebook,
    isEdge,
    isIETrident,
    isIE,
    isFF,
    isMSIE,
    isSafari,
    isAndroid,
    isAndroidNative,
    isIOS,
    isMobile,
    isOSX,
    isIPad,
    isIPod,
    isIframe,
    isFlashSupported,
    flashVersion,
} from 'utils/browser';

describe('browser', function() {

    it('browser checks', function() {
        expect(isChrome(), 'isChrome').to.be.a('boolean');
        expect(isFacebook(), 'isFacebook').to.be.a('boolean');
        expect(isFF(), 'isFF').to.be.a('boolean');
        expect(isIETrident(), 'isIETrident').to.be.a('boolean');
        expect(isMSIE(), 'isMSIE').to.be.a('boolean');
        expect(isIE(), 'isIE').to.be.a('boolean');
        expect(isEdge(), 'isEdge').to.be.a('boolean');
        expect(isSafari(), 'isSafari').to.be.a('boolean');
        expect(isIOS(), 'isIOS').to.be.a('boolean');
        expect(isAndroidNative(), 'isAndroidNative').to.be.a('boolean');
        expect(isAndroid(), 'isAndroid').to.be.a('boolean');
        expect(isMobile(), 'isMobile').to.be.a('boolean');
        expect(isOSX(), 'isOSX').to.be.a('boolean');
        expect(isIPad(), 'isIPad').to.be.a('boolean');
        expect(isIPod(), 'isIPod').to.be.a('boolean');
        expect(isIframe(), 'isIframe').to.be.a('boolean');
        expect(isFlashSupported(), 'isFlashSupported').to.be.a('boolean');
    });

    it('browser.flashVersion test', function() {
        const version = flashVersion();

        expect(typeof version, 'Flash version is ' + version).to.equal('number');
    });

});
