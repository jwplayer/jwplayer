define([
], function() {
    return {
        createId: function (track, tracksCount) {
            var trackId;
            var prefix = track.kind || 'cc';
            if (track.default || track.defaulttrack) {
                trackId = 'default';
            } else {
                trackId = track._id || track.file || track.name || track.label || (prefix + tracksCount);
            }
            return trackId;
        },
        createLabel: function (track, unknownCount) {
            var label = track.label || track.name || track.language;
            if (!label) {
                label = 'Unknown CC';
                unknownCount += 1;
                if (unknownCount > 1) {
                    label += ' [' + unknownCount + ']';
                }
            }
            return { label: label, unknownCount: unknownCount };
        }
    };
});