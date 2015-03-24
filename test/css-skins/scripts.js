$(document).ready(function(){
    $('.jwplayer').css('width', '100%');

    setTimeout(function(){
        jQuery('.tooltip-icon').on('click', function(e){
            $(this).toggleClass('open');
        });

        jQuery('.100pct_300px_uniform').on('click', function(e){
        //document.getElementById('100pct_300px_uniform').addEventListener('click', function(e){
            $('.jwplayer').css('width', '100%');
            $('.jwplayer').css('height', '300px');
            $('.jw-preview').css('background-size', 'contain');
            $('.jwplayer').css('position', 'relative');
            $('.jwplayer').css('top', 'auto');
            $('.jwplayer').css('right', 'auto');
            $('.jwplayer').css('bottom', 'auto');
            $('.jwplayer').css('left', 'auto');
        });

        jQuery('.100pct_300px_none').on('click', function(e){
            $('.jwplayer').css('width', '100%');
            $('.jwplayer').css('height', '300px');
            $('.jw-preview').css('background-size', 'auto auto');
            $('.jwplayer').css('position', 'relative');
            $('.jwplayer').css('top', 'auto');
            $('.jwplayer').css('right', 'auto');
            $('.jwplayer').css('bottom', 'auto');
            $('.jwplayer').css('left', 'auto');
        });

        jQuery('.100pct_300px_fill').on('click', function(e){
            $('.jwplayer').css('width', '100%');
            $('.jwplayer').css('height', '300px');
            $('.jw-preview').css('background-size', 'cover');
            $('.jwplayer').css('position', 'relative');
            $('.jwplayer').css('top', 'auto');
            $('.jwplayer').css('right', 'auto');
            $('.jwplayer').css('bottom', 'auto');
            $('.jwplayer').css('left', 'auto');
        });

        jQuery('.100pct_300px_exactfit').on('click', function(e){
            $('.jwplayer').css('width', '100%');
            $('.jwplayer').css('height', '300px');
            $('.jw-preview').css('background-size', '100% 100%');
            $('.jwplayer').css('position', 'relative');
            $('.jwplayer').css('top', 'auto');
            $('.jwplayer').css('right', 'auto');
            $('.jwplayer').css('bottom', 'auto');
            $('.jwplayer').css('left', 'auto');
        });

        jQuery('#window-size').on('click', function(e){
            $('.jwplayer').css('width', '100%');
            $('.jwplayer').css('height', '100%');
            $('.jw-preview').css('background-size', 'contain');

            $('.jwplayer').css('position', 'fixed');
            $('.jwplayer').css('top', '0');
            $('.jwplayer').css('right', '0');
            $('.jwplayer').css('bottom', '0');
            $('.jwplayer').css('left', '0');
        });




        jQuery('#idle-state').on('click', function(e){
            $('.jwplayer').removeClass('play-state');
            $('.jwplayer').removeClass('pause-state');
            $('.jwplayer').removeClass('buffering-state');
            $('.jwplayer .jw-display-icon .jw-icon').addClass('jw-icon-play');
            $('.jwplayer .jw-display-icon .jw-icon').removeClass('jw-icon-buffer');

            $($('.jwplayer .jw-left .jw-icon')[0]).addClass('jw-icon-play');
            $($('.jwplayer .jw-left .jw-icon')[0]).removeClass('jw-icon-pause');
        });
        jQuery('.play-state').on('click', function(e){
            $('.jwplayer').addClass('play-state');
            $('.jwplayer').removeClass('pause-state');
            $('.jwplayer').removeClass('buffering-state');
            $('.jwplayer .jw-display-icon .jw-icon').addClass('jw-icon-play');
            $('.jwplayer .jw-display-icon .jw-icon').removeClass('jw-icon-buffer');

            $($('.jwplayer .jw-left .jw-icon')[0]).removeClass('jw-icon-play');
            $($('.jwplayer .jw-left .jw-icon')[0]).addClass('jw-icon-pause');
        });
        jQuery('.pause-state').on('click', function(e){
            $('.jwplayer').removeClass('play-state');
            $('.jwplayer').addClass('pause-state');
            $('.jwplayer').removeClass('buffering-state');
            $('.jwplayer .jw-display-icon .jw-icon').addClass('jw-icon-play');
            $('.jwplayer .jw-display-icon .jw-icon').removeClass('jw-icon-buffer');

            $($('.jwplayer .jw-left .jw-icon')[0]).addClass('jw-icon-play');
            $($('.jwplayer .jw-left .jw-icon')[0]).removeClass('jw-icon-pause');
        });
        jQuery('#buffering-state').on('click', function(e){
            $('.jwplayer').removeClass('play-state');
            $('.jwplayer').removeClass('pause-state');
            $('.jwplayer').addClass('buffering-state');
            $('.jwplayer .jw-display-icon .jw-icon').removeClass('jw-icon-play');
            $('.jwplayer .jw-display-icon .jw-icon').addClass('jw-icon-buffer');

            $($('.jwplayer .jw-left .jw-icon')[0]).addClass('jw-icon-play');
            $($('.jwplayer .jw-left .jw-icon')[0]).removeClass('jw-icon-pause');
        });

    }, 1000);
});