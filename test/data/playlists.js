define(['data/mixed'], function(mixed) {

    return {
        webm_mp4 : [ mixed.webm_mp4, mixed.mp4_webm],
        mp4_webm : [ mixed.mp4_webm, mixed.webm_mp4]
    };
});
