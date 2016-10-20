/* jshint jquery: true */
window.requireBaseUrl = document.location.href.replace(/[^\/]+\/[^\/]+\/[^\/]*$/, '');
window.requireCallback = function(){
    require([
        'mock/mock-api',
        'mock/mock-model',
        'view/view',
        'css/jwplayer.less'
    ], function(mockApi, mockModel, View) {

        function makePlayer(state) {
            var m = _.extend({}, mockModel);
            m.setup();

            var view = new View(mockApi, m);
            view.setup();
            m.set('state', state);
            view.resize(400, 300);

            window[state] = m;

            var $wrapper = $('<div class="wrapper"></div>')
                .append('<h2>' + state + '</h3>')
                .append(view.element());
            $('body').append($wrapper);
        }

        function updateFlagList() {
            var classList = $('.jwplayer').first()[0].className.split(' ');

            // remove the leading 'jwplayer' class
            classList.shift();
            $('#classes').html('<li>' + classList.join('</li><li>') + '</li>');
        }

        // Player states
        _.each([
            'idle',
            'playing',
            'paused',
            'buffering',
            'complete',
            'error'
        ], makePlayer);

        // Flags
        _.each([
            'jw-flag-ads',
            'jw-flag-live',
            'jw-flag-user-inactive',
            'jw-flag-controlbar-only',
            'jw-flag-media-audio',
            'jw-flag-dragging',
            'jw-flag-aspect-mode',
            'jw-flag-cast-available',
            'jw-flag-live',
            'jw-flag-controlbar-only',
            'jw-flag-media-audio',
            'jw-flag-dragging'
            // 'jw-flag-fullscreen' // cannot escape!
        ], function(val) {
            var $btn = $('<input>', {
                type: 'button',
                value: val
            });
            $btn.click(function() {
                $('.jwplayer').toggleClass(val);
                updateFlagList();
            });
            $('#flagButtons').append($btn);
        });

        // Player Skins
        var skinButtons = [
            'jw-skin-beelden',
            'jw-skin-bekle',
            'jw-skin-five',
            'jw-skin-glow',
            'jw-skin-roundster',
            'jw-skin-seven',
            'jw-skin-six',
            'jw-skin-stormtrooper',
            'jw-skin-vapor',
            'jw-skin-custom-none'
        ];
        _.each(skinButtons, function(val) {
            var $btn = $('<input>', {
                type: 'button',
                value: val
            });
            $btn.click(function() {
                $('.jwplayer').removeClass(skinButtons.join(' '));
                $('.jwplayer').addClass(val);
            });
            $('#skinButtons').append($btn);
        });


        // Video/Poster stretch options
        var stretchButtons = [
            'jw-stretch-none',
            'jw-stretch-exactfit',
            'jw-stretch-uniform',
            'jw-stretch-fill'
        ];
        _.each(stretchButtons, function(val) {
            var $btn = $('<input>', {
                type: 'button',
                value: val
            });
            $btn.click(function() {
                $('.jwplayer').removeClass(stretchButtons.join(' '));
                $('.jwplayer').addClass(val);
            });
            $('#stretchButtons').append($btn);
        });
        _.delay(updateFlagList, 100);
    });
};
