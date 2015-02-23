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

    var helperString = [JW_CLASS, 'div', 'span', 'a', 'img', 'ul', 'li', 'video'].join(', ' + JW_CLASS);
    _css(helperString + ', .jwclick', {
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
        'line-height': 20,
        '-webkit-tap-highlight-color': 'rgba(255, 255, 255, 0)'
    });

    // Reset box-sizing to default for player and all sub-elements
    //  Note: If we use pseudo elements we will need to add *:before and *:after
    _css(JW_CLASS + ',' + JW_CLASS + '*', { 'box-sizing': 'content-box'});
    // Browsers use border-box as a the default box-sizing for many form elements
    _css(JW_CLASS + '* button,' + JW_CLASS + '* input,' + JW_CLASS + '* select,' + JW_CLASS + '* textarea',
        { 'box-sizing': 'border-box'});


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
