/**
 * jwplayer.html5 namespace
 *
 * @author pablo
 * @version 6.0
 */
(function(jwplayer) {
    jwplayer.html5 = {};
    jwplayer.html5.version = 'X.Y.ZZZZ';

    // These 'reset' styles must be included before any others
    var _css = jwplayer.utils.css;
    var JW_CLASS = '.jwplayer ';

    var helperString = ['', 'div', 'span', 'a', 'img', 'ul', 'li', 'video'].join(', ' + JW_CLASS);
    _css(JW_CLASS.slice(0, -1) + helperString + ', .jwclick', {
        margin: 0,
        padding: 0,
        border: 0,
        color: '#000000',
        'font-size': '100%',
        font: 'inherit',
        'vertical-align': 'baseline',
        'background-color': 'transparent',
        'text-align': 'left',
        'direction': 'ltr',
        '-webkit-tap-highlight-color': 'rgba(255, 255, 255, 0)'
    });

    _css(JW_CLASS + 'ul', {
        'list-style': 'none'
    });


    // These rules allow click and hover events to reach the provider, instead
    //  of being blocked by the controller element
    //  ** Note : pointer-events will not work on IE < 11
    _css('.jwplayer .jwcontrols', {
        'pointer-events': 'none'
    });
    _css('.jwplayer.jw-user-inactive .jwcontrols', {
        'pointer-events': 'all'
    });
    var acceptClicks = [
        '.jwplayer .jwcontrols .jwdockbuttons',
        '.jwplayer .jwcontrols .jwcontrolbar',
        '.jwplayer .jwcontrols .jwskip',
        '.jwplayer .jwcontrols .jwdisplayIcon', // play and replay button
        '.jwplayer .jwcontrols .jwpreview', // poster image
        '.jwplayer .jwcontrols .jwlogo'
    ];
    _css(acceptClicks.join(', '), {
        'pointer-events' : 'all'
    });

})(jwplayer);
