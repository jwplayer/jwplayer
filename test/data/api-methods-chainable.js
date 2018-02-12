export default {
    // values represent the method's expected arguments

    // These are commented out because they throw exception before setup
    //   setCurrentCaptions: [{}],
    //   setCurrentQuality: [0],
    //   setCurrentAudioTrack: [0],
    //   setCaptions: [{}],

    seek: [0],
    playlistNext: undefined,
    playlistPrev: undefined,
    playlistItem: [0],
    setup: [{}],
    load: [{}],
    play: undefined,
    pause: undefined,
    playToggle: undefined,
    setControls: [true],
    setFullscreen: [false],
    setVolume: [100],
    setMute: [false],
    setCues: [[]],
    resize: [100, 75],
    on: ['', function() {}],
    once: ['', function() {}],
    trigger: [''],
    off: undefined,
    remove: undefined
};
