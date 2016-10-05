define([], function() {
    return function (track, unknownCount) {
        var label = track.label || track.name || track.language;
        if (!label) {
            label = 'Unknown CC';
            unknownCount += 1;
            if (unknownCount > 1) {
                label += ' [' + unknownCount + ']';
            }
        }
        return { label: label, unknownCount: unknownCount };
    };
});
