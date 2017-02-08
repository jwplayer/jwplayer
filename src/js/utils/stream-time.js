define([

], function () {
    function rewindPosition(amount, currentPosition, seekableStart) {
        return Math.max(seekableStart, currentPosition - amount);
    }
    return {
        rewindPosition: rewindPosition,
    };
});
