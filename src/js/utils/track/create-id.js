define([], function() {
    return function (track, tracksCount) {
        var trackId;
        var prefix = track.kind || 'cc';
        if (track.default || track.defaulttrack) {
            trackId = 'default';
        } else {
            trackId = track._id || track.name || track.file || track.label || (prefix + tracksCount);
        }
        return trackId;
    };
});
