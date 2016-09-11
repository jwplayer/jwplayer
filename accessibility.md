# Accessibility in JWPlayer


## Testing the branch `aria-attributes`


### Tools used

In order to test the `aria-label` and other accessibility related attributes, I use [Safari](http://www.apple.com/safari/) on [Mac OS Yosemite](https://en.wikipedia.org/wiki/OS_X_Yosemite) controlled with [VoiceOver](http://www.apple.com/accessibility/osx/voiceover/) using their dedicated keyboard shortcuts.

Safari offers the best results with VoiceOver since both technologies are developed by the same company with accessibility in mind. 
Another strong advantage of VoiceOver is its availability on iOS devices such as the iPhone, iPad or iPod touch.

Other screen readers could be used for testing such as:

- On Mac OS X
  - VoiceOver + [Mozilla Firefox](https://www.mozilla.org/en-US/firefox/new/)
  - VoiceOver + [Google Chrome](https://www.google.com/chrome/)
- On iOS
  - VoiceOver + Mobile Safari
- On Windows
  - Using [JAWS](http://www.freedomscientific.com/Products/Blindness/JAWS) screen reader (requires the purchase of a licence)
  - A free alternative is [nvaccess](nvaccess.org)


### Testing

I build `jwplayer` using the `grunt` command in my Terminal and points my `localhost` to its folder in order to browse to the manual test page... Once on the page I activate VoiceOver by hitting `cmd + F5`.

Apple made a great interactive tutorial that you should go through in order to use VoiceOver. You will get an opportunity to visit it each time you activate VoiceOver, if not, visit the `System preferences > Accessibility` and choose VoiceOver.

Testing on the iPhone is limited due to the fact that the native player from iOS handles the video controls once the video started playing...

On iPad, I believe that you can use the player without being forced into fullscreen (and native) mode...


#### Elements to be tested

The changes made in the `aria-attributes` branch uses `aria-label` attribute with a value that can be customized or translated.

##### DisplayIcon

The DisplayIcon is the centered button shown on top of the video player before the media is played.
Its markup receives new attributes: `role="button"`, `tabindex="0"` and `aria-label="Play"`.

- `role="button"` indicates that independently from the html element used, it should be considered as a button.
- `tabindex="0"` indicates that it should be "tabbed through" in the natural order (same order as in the markup).
- `aria-label="Play"` provides a description for the screen reader softwares...

The DisplayIcon can receive different `aria-label` values depending on the current state of the player:

- "Play" — by default
- "Loading" — while the media is buffering
- "Pause" — while media is playing
- "Replay" — when media playback is completed
- "" (empty) — in case of error


##### AltText

This is the alternative text shown inside the control bar for special cases such as:

- "Loading ad"
- "Live Broadcast"

These texts can now be translated by providing another value in the `config` object...
It receives a `role="status"`.

##### The `aria-hidden` controls

Some controls are deliberately hidden because they not supported yet or because they affect the VoiceOver experience.

- Timeline slider
- Error screen


##### Other UI/buttons

- Play/Pause
- Playlist
- Previous
- Next
- Volume
- Quality
- Closed captions
- Audio tracks
- Chromecast
- Fullscreen
- More
- Time elapsed/remaining — receive a `role="timer"`


## Existing accessibility issues

There is still more work to be done in order to improve the accessibility for JWPlayer, but providing `aria-label` attributes is a good start.

### Controlbar gets hidden

When the video is playing and after few seconds, the control bar becomes hidden!
It becomes difficult to use it with the keyboard...

It is due to this CSS rule:

```
.jwplayer.jw-flag-user-inactive.jw-state-playing .jw-controlbar, 
.jwplayer.jw-flag-user-inactive.jw-state-playing .jw-dock {
    display: none;
}
```

### Tooltip menus are not keyboard friendly

Tooltip menus are not usable with the keyboard because they are shown based on mouse event such as hover, we should be able to toggle their visibility by click which is emulated nicely by the keyboard.

- playlist menu
- quality menu
- vertical volume slider

Even if related to tooltip elements, some button can still serve a purpose such as the volume button which can also be clicked to toggle mute/unmute...

### Sliders are not keyboard friendly

Any help on this is welcome :^)
