

$(document).ready(function(){
    $('.jwplayer').css('width', '100%');

    $('.tooltip-icon').on('click', function(e){
        $(this).toggleClass('open');
    });

    var uniform = function(e){
        //document.getElementById('100pct_300px_uniform').attachEvent('click', function(e){
        $('.jwplayer').css('width', '100%');
        $('.jwplayer').css('height', '300px');
        $('.jw-preview').css('background-size', 'contain');
        $('.jwplayer').css('position', 'relative');
        $('.jwplayer').css('top', 'auto');
        $('.jwplayer').css('right', 'auto');
        $('.jwplayer').css('bottom', 'auto');
        $('.jwplayer').css('left', 'auto');
        $('.button-cont-top').css('position', 'relative');
    };

    $('#100pct_300px_uniform').on('click', uniform);
    if(document.attachEvent) document.getElementById('100pct_300px_uniform').attachEvent('onclick', uniform);

    var none = function(e){
        $('.jwplayer').css('width', '100%');
        $('.jwplayer').css('height', '300px');
        $('.jw-preview').css('background-size', 'auto auto');
        $('.jwplayer').css('position', 'relative');
        $('.jwplayer').css('top', 'auto');
        $('.jwplayer').css('right', 'auto');
        $('.jwplayer').css('bottom', 'auto');
        $('.jwplayer').css('left', 'auto');
        $('.button-cont-top').css('position', 'relative');
    };

    $('#100pct_300px_none').on('click', none);
    if(document.attachEvent) document.getElementById('100pct_300px_uniform').attachEvent('onclick', none);

    var fill = function(e){
        $('.jwplayer').css('width', '100%');
        $('.jwplayer').css('height', '300px');
        $('.jw-preview').css('background-size', 'cover');
        $('.jwplayer').css('position', 'relative');
        $('.jwplayer').css('top', 'auto');
        $('.jwplayer').css('right', 'auto');
        $('.jwplayer').css('bottom', 'auto');
        $('.jwplayer').css('left', 'auto');
        $('.button-cont-top').css('position', 'relative');
    };

    $('#100pct_300px_fill').on('click', fill);
    if(document.attachEvent) document.getElementById('100pct_300px_fill').attachEvent('onclick', fill);

    var exactfit = function(e){
        $('.jwplayer').css('width', '100%');
        $('.jwplayer').css('height', '300px');
        $('.jw-preview').css('background-size', '100% 100%');
        $('.jwplayer').css('position', 'relative');
        $('.jwplayer').css('top', 'auto');
        $('.jwplayer').css('right', 'auto');
        $('.jwplayer').css('bottom', 'auto');
        $('.jwplayer').css('left', 'auto');
        $('.button-cont-top').css('position', 'relative');
    };

    $('#100pct_300px_exactfit').on('click', exactfit);
    if(document.attachEvent) document.getElementById('100pct_300px_exactfit').attachEvent('onclick', exactfit);

    var windowsize = function(e){
        $('.jwplayer').css('width', '100%');
        $('.jwplayer').css('height', '100%');
        $('.jw-preview').css('background-size', 'contain');

        $('.jwplayer').css('position', 'fixed');
        $('.jwplayer').css('top', '0');
        $('.jwplayer').css('right', '0');
        $('.jwplayer').css('bottom', '0');
        $('.jwplayer').css('left', '0');
        $('.button-cont-top').css('position', 'absolute');
    };

    $('#window-size').on('click', windowsize);
    if(document.attachEvent) document.getElementById('window-size').attachEvent('onclick', windowsize);

    var aspect169 = function(e){
        $('.jwplayer').css('width', '100%');
        $('.jwplayer').css('height', 'auto');
        $('.jw-preview').css('background-size', 'contain');

        $('.jwplayer').css('position', 'relative');
        $('.jwplayer').css('top', 'auto');
        $('.jwplayer').css('right', 'auto');
        $('.jwplayer').css('bottom', 'auto');
        $('.jwplayer').css('left', 'auto');
        $('.button-cont-top').css('position', 'relative');

        document.styleSheets[0].addRule('.jwplayer:before','padding-top: ' + Math.round(9/16 * 100) + '%');
        if(document.attachEvent)document.styleSheets[0].addRule('.jwplayer:before','content: ' + Math.round(Math.random()*1000));
        if(!document.attachEvent) document.styleSheets[0].insertRule('.jwplayer:before { padding-top: ' + Math.round(9/16 * 100) + '%; }', 0);
        //$('.jwplayer:before').css('padding-top', Math.round(9/16 * 100) + '%');
    };

    $('#aspect-ratio-16-9').on('click', aspect169);
    if(document.attachEvent) document.getElementById('aspect-ratio-16-9').attachEvent('onclick', aspect169);

    var aspect43 = function(e){
        $('.jwplayer').css('width', '100%');
        $('.jwplayer').css('height', 'auto');
        $('.jw-preview').css('background-size', 'contain');

        $('.jwplayer').css('position', 'relative');
        $('.jwplayer').css('top', 'auto');
        $('.jwplayer').css('right', 'auto');
        $('.jwplayer').css('bottom', 'auto');
        $('.jwplayer').css('left', 'auto');
        $('.button-cont-top').css('position', 'relative');

        document.styleSheets[0].addRule('.jwplayer:before','padding-top: ' + Math.round(3/4 * 100) + '%');
        if(document.attachEvent)document.styleSheets[0].addRule('.jwplayer:before','content: ' + Math.round(Math.random()*1000));
        if(!document.attachEvent) document.styleSheets[0].insertRule('.jwplayer:before { padding-top: ' + Math.round(3/4 * 100) + '%; }', 0);
        //$('.jwplayer:before').css('padding-top', Math.round(3/4 * 100) + '%');
    };

    $('#aspect-ratio-4-3').on('click', aspect43);
    if(document.attachEvent) document.getElementById('aspect-ratio-4-3').attachEvent('onclick', aspect43);





    var idlestate = function(e) {
        $('.jwplayer').removeClass('play-state');
        $('.jwplayer').removeClass('pause-state');
        $('.jwplayer').removeClass('buffering-state');
        $('.jwplayer .jw-display-icon .jw-icon').addClass('jw-icon-play');
        $('.jwplayer .jw-display-icon .jw-icon').removeClass('jw-icon-buffer');

        $($('.jwplayer .jw-left .jw-icon')[0]).addClass('jw-icon-play');
        $($('.jwplayer .jw-left .jw-icon')[0]).removeClass('jw-icon-pause');
    };

    $('#idle-state').on('click', idlestate);
    if(document.attachEvent) document.getElementById('idle-state').attachEvent('onclick', idlestate);


    var playstate = function(e){
        $('.jwplayer').addClass('play-state');
        $('.jwplayer').removeClass('pause-state');
        $('.jwplayer').removeClass('buffering-state');
        $('.jwplayer .jw-display-icon .jw-icon').addClass('jw-icon-play');
        $('.jwplayer .jw-display-icon .jw-icon').removeClass('jw-icon-buffer');

        $($('.jwplayer .jw-left .jw-icon')[0]).removeClass('jw-icon-play');
        $($('.jwplayer .jw-left .jw-icon')[0]).addClass('jw-icon-pause');
    };

    $('#play-state').on('click', playstate);
    if(document.attachEvent) document.getElementById('play-state').attachEvent('onclick', playstate);


    var pausestate = function(e){
        $('.jwplayer').removeClass('play-state');
        $('.jwplayer').addClass('pause-state');
        $('.jwplayer').removeClass('buffering-state');
        $('.jwplayer .jw-display-icon .jw-icon').addClass('jw-icon-play');
        $('.jwplayer .jw-display-icon .jw-icon').removeClass('jw-icon-buffer');

        $($('.jwplayer .jw-left .jw-icon')[0]).addClass('jw-icon-play');
        $($('.jwplayer .jw-left .jw-icon')[0]).removeClass('jw-icon-pause');
    };

    $('#pause-state').on('click', pausestate);
    if(document.attachEvent) document.getElementById('pause-state').attachEvent('onclick', pausestate);

    var bufferingstate = function(e){
        $('.jwplayer').removeClass('play-state');
        $('.jwplayer').removeClass('pause-state');
        $('.jwplayer').addClass('buffering-state');
        $('.jwplayer .jw-display-icon .jw-icon').removeClass('jw-icon-play');
        $('.jwplayer .jw-display-icon .jw-icon').addClass('jw-icon-buffer');

        $($('.jwplayer .jw-left .jw-icon')[0]).addClass('jw-icon-play');
        $($('.jwplayer .jw-left .jw-icon')[0]).removeClass('jw-icon-pause');
    };

    $('#buffering-state').on('click', bufferingstate);
    if(document.attachEvent) document.getElementById('buffering-state').attachEvent('onclick', bufferingstate);
});