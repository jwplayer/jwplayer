export const INITIAL_PLAYER_STATE = {
    // always start on first playlist item
    item: 0,
    itemMeta: {},
    playlistItem: undefined,
    // Initial state, upon setup
    state: 'idle',
    // Initially we don't assume Flash is needed
    flashBlocked: false,
    provider: undefined,
    duration: 0,
    position: 0,
    buffer: 0
};
