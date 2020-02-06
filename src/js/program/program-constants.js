// The number of tags allocated in the media pool
export const MEDIA_POOL_SIZE = 4;
// The number of seconds before a BGL trigger at which we should start background loading. This ensures that we have
// kicked off background loading before being able to transition to that item
export const BACKGROUND_LOAD_OFFSET = 5;
// The minimum time from the start of a video in which we can background load
export const BACKGROUND_LOAD_MIN_OFFSET = 1;
