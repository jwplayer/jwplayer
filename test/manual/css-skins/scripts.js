$(document).ready(function(){
    $('.jwplayer').css('width', '100%');

    $('.jw-icon-tooltip').on('click', function(e){
        $(this).toggleClass('jw-open');
    });

    var uniform = function(e){
        $('.jwplayer').addClass('player-size');
        $('.jwplayer').removeClass('window-size aspect-size');

        $('.jwplayer').addClass('uniform-stretching');
        $('.jwplayer').removeClass('fill-stretching exactfit-stretching none-stretching');

        $('.button-cont-top').addClass('fixed-buttons');
    };

    $('#100pct_300px_uniform').on('click', uniform);
    if(document.attachEvent) document.getElementById('100pct_300px_uniform').attachEvent('onclick', uniform);

    var none = function(e){
        $('.jwplayer').addClass('player-size');
        $('.jwplayer').removeClass('window-size aspect-size');

        $('.jwplayer').addClass('none-stretching');
        $('.jwplayer').removeClass('fill-stretching exactfit-stretching uniform-stretching');

        $('.button-cont-top').addClass('fixed-buttons');
    };

    $('#100pct_300px_none').on('click', none);
    if(document.attachEvent) document.getElementById('100pct_300px_uniform').attachEvent('onclick', none);

    var fill = function(e){
        $('.jwplayer').addClass('player-size');
        $('.jwplayer').removeClass('window-size aspect-size');

        $('.jwplayer').addClass('fill-stretching');
        $('.jwplayer').removeClass('none-stretching exactfit-stretching uniform-stretching');

        $('.button-cont-top').addClass('fixed-buttons');
    };

    $('#100pct_300px_fill').on('click', fill);
    if(document.attachEvent) document.getElementById('100pct_300px_fill').attachEvent('onclick', fill);

    var exactfit = function(e){
        $('.jwplayer').addClass('player-size');
        $('.jwplayer').removeClass('window-size aspect-size');

        $('.jwplayer').addClass('exactfit-stretching');
        $('.jwplayer').removeClass('none-stretching fill-stretching uniform-stretching');

        $('.button-cont-top').addClass('fixed-buttons');
    };

    $('#100pct_300px_exactfit').on('click', exactfit);
    if(document.attachEvent) document.getElementById('100pct_300px_exactfit').attachEvent('onclick', exactfit);

    var windowsize = function(e){
        $('.jwplayer').addClass('window-size');
        $('.jwplayer').removeClass('player-size aspect-size');

        $('.jwplayer').addClass('uniform-stretching');
        $('.jwplayer').removeClass('none-stretching fill-stretching exactfit-stretching');

        $('.button-cont-top').addClass('fixed-buttons');
    };

    $('#window-size').on('click', windowsize);
    if(document.attachEvent) document.getElementById('window-size').attachEvent('onclick', windowsize);

    var aspect169 = function(e){
        $('.jwplayer').addClass('aspect-size');
        $('.jwplayer').removeClass('player-size window-size');

        $('.jwplayer').addClass('uniform-stretching');
        $('.jwplayer').removeClass('none-stretching fill-stretching exactfit-stretching');

        $('.button-cont-top').removeClass('fixed-buttons');

        document.styleSheets[0].addRule('.jwplayer:before','padding-top: ' + Math.round(9/16 * 100) + '%');
        if(document.attachEvent)document.styleSheets[0].addRule('.jwplayer:before','content: ' + Math.round(Math.random()*1000));
        if(!document.attachEvent) document.styleSheets[0].insertRule('.jwplayer:before { padding-top: ' + Math.round(9/16 * 100) + '%; }', 0);
        //$('.jwplayer:before').css('padding-top', Math.round(9/16 * 100) + '%');
    };

    $('#aspect-ratio-16-9').on('click', aspect169);
    if(document.attachEvent) document.getElementById('aspect-ratio-16-9').attachEvent('onclick', aspect169);

    var aspect43 = function(e){
        $('.jwplayer').addClass('aspect-size');
        $('.jwplayer').removeClass('player-size window-size');

        $('.jwplayer').addClass('uniform-stretching');
        $('.jwplayer').removeClass('none-stretching fill-stretching exactfit-stretching');

        $('.button-cont-top').removeClass('fixed-buttons');

        document.styleSheets[0].addRule('.jwplayer:before','padding-top: ' + Math.round(3/4 * 100) + '%');
        if(document.attachEvent)document.styleSheets[0].addRule('.jwplayer:before','content: ' + Math.round(Math.random()*1000));
        if(!document.attachEvent) document.styleSheets[0].insertRule('.jwplayer:before { padding-top: ' + Math.round(3/4 * 100) + '%; }', 0);
        //$('.jwplayer:before').css('padding-top', Math.round(3/4 * 100) + '%');
    };

    $('#aspect-ratio-4-3').on('click', aspect43);
    if(document.attachEvent) document.getElementById('aspect-ratio-4-3').attachEvent('onclick', aspect43);


    var idlestate = function(e) {
        $('.jwplayer').addClass('jw-state-idle');
        $('.jwplayer').removeClass('jw-state-play jw-state-pause jw-state-buffer jw-state-replay');

        //$('.jwplayer').removeClass('pause-state');
        //$('.jwplayer').removeClass('buffering-state');
        //$('.jwplayer .jw-display-icon-cont .jw-icon-display').addClass('jw-icon-play');
        //$('.jwplayer .jw-display-icon-cont .jw-icon-display').removeClass('jw-icon-buffer');
        //
        //$($('.jwplayer .jw-left .jw-icon')[0]).addClass('jw-icon-play');
        //$($('.jwplayer .jw-left .jw-icon')[0]).removeClass('jw-icon-pause');
    };

    $('#idle-state').on('click', idlestate);
    if(document.attachEvent) document.getElementById('idle-state').attachEvent('onclick', idlestate);


    var playstate = function(e){
        $('.jwplayer').addClass('jw-state-play');
        $('.jwplayer').removeClass('jw-state-idle jw-state-pause jw-state-buffer jw-state-replay');
    };

    $('#play-state').on('click', playstate);
    if(document.attachEvent) document.getElementById('play-state').attachEvent('onclick', playstate);


    var pausestate = function(e){
        $('.jwplayer').addClass('jw-state-pause');
        $('.jwplayer').removeClass('jw-state-play jw-state-idle jw-state-buffer jw-state-replay');
    };

    $('#pause-state').on('click', pausestate);
    if(document.attachEvent) document.getElementById('pause-state').attachEvent('onclick', pausestate);

    var bufferingstate = function(e){
        $('.jwplayer').addClass('jw-state-buffer');
        $('.jwplayer').removeClass('jw-state-play jw-state-pause jw-state-idle jw-state-replay');
    };

    $('#buffering-state').on('click', bufferingstate);
    if(document.attachEvent) document.getElementById('buffering-state').attachEvent('onclick', bufferingstate);

    var replaystate = function(e){
        $('.jwplayer').addClass('jw-state-replay');
        $('.jwplayer').removeClass('jw-state-play jw-state-pause jw-state-buffer jw-state-idle');
    };

    $('#replay-state').on('click', replaystate);
    if(document.attachEvent) document.getElementById('replay-state').attachEvent('onclick', replaystate);
});