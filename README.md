# [JW Player](http://jwplayer.com)

<img src="http://www.jwplayer.com/wp-content/uploads/social_thumb.png" alt="JW Player Logo" title="JW Player Logo" align="right" width="150" />

JW Player is a the world's most popular embeddable media player.

* **Cross browser:** Play your video and audio files easily on all major browsers and mobile devices. Full details [here](http://support.jwplayer.com/customer/portal/articles/1403727-what-is-jw-player-).
* **Media formats:** Play MP4, WebM, FLV, HLS, YouTube videos, [and more](http://support.jwplayer.com/customer/portal/articles/1403635-media-format-reference).
* **Open Source:** JW Player is free for non-commercial use. For commercial uses, users must [purchase a license](http://www.jwplayer.com/pricing/).

For documentation and support, please visit the [JW Player Support Site](http://support.jwplayer.com/).

## Examples

We have several articles and examples on the [JW Player Support Site](http://support.jwplayer.com/customer/portal/topics/564475-javascript-api/articles).

The example below will find the element with an id of *myVideoId* and render a video player into it. We will then
create an event handler to watch for when someone changes the volume.

```js
	jwplayer('myVideoId').setup({
		file: '/uploads/example.mp4',
	});

	jwplayer('myVideoId').onVolume(function(event) {
		console.log('The volume has changed', event);
	});
```

Note that we could also use functions **getVolume**, **setVolume** and others which can be found [here](http://support.jwplayer.com/customer/portal/topics/564475-javascript-api/articles).

## Contributing

### Style Guide
For our javascript code, we follow the [Douglas Crockford Style guide](http://javascript.crockford.com/code.html)

Before submitting a change be sure to verify it follows our guide by using
```sh
grunt jshint
```

### Build Instructions

To build the JW Player, you will need the following software:

 * Flex SDK 4.1: http://sourceforge.net/adobe/flexsdk/wiki/Downloads/
 * Ant 1.7.0: http://ant.apache.org/bindownload.cgi
 * Python 3.4.2: https://www.python.org/downloads

To compile with Flex and Ant, you'll first need to modify the `build.properties` file found in the `build` folder:

1. Set `flexsdk` to the install location of the Flex SDK (e.g. `/usr/local/bin/flex/`)
2. Set `python` to the install location of the Python (e.g. `usr/local/bin/python34`)
3. Set `execextension` to `.exe` if you're using Windows; otherwise leave it blank.
4. Fix "load jvm.dll" on Windows 7: set evironment variable `JAVA_HOME` to your JDK x86 (Java SE) install location. (e.g `C:\PROGRA~2\Java\jdk1.8.0_25`)

You can now compile the player using Ant:

```sh
ant -buildfile build\build.xml
```

If the build is successful, the new player assets (jwplayer.js, jwplayer.html5.js, jwplayer.flash.swf) will appear in the `bin-release` folder.

## Software License
The use of the JW Player Open Source edition is governed by a [Creative Commons license](http://creativecommons.org/licenses/by-nc-sa/3.0/). You can use, modify, copy, and distribute this edition as long as it’s for non-commercial use, you provide attribution, and share under a similar license.
http://www.jwplayer.com/license/

