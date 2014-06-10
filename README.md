# JW Player

<img src="http://www.jwplayer.com/wp-content/uploads/social_thumb.png" alt="JW Player Logo" title="JW Player Logo" align="right" width="150" />

JW Player is the world's most popular embeddable media player for websites. It supports video and audio playback on a wide array of desktop browsers and mobile devices across many media formats. It is easy to configure, customize and extend.

For documentation and support, please visit the [JW Player Support Site](http://support.jwplayer.com/).

The JW Player is free for non-commerical use. For commercial uses, users must [purchase a license](http://www.jwplayer.com/pricing/).

## Build Instructions ##

To build the JW Player, you will need the following software:

 * Flex SDK 4.1: http://sourceforge.net/adobe/flexsdk/wiki/Downloads/
 * Ant 1.7.0: http://ant.apache.org/bindownload.cgi

To compile with Flex and Ant, you'll first need to modify the `build.properties` file found in the `build` folder:

1. Set `flexsdk` to the install location of the Flex SDK (e.g. `/usr/local/bin/flex/`)
1. Set `execextension` to `.exe` if you're using Windows; otherwise leave it blank.

You can now compile the player using Ant:

`ant -buildfile build\build.xml`

If the build is successful, the new player assets (jwplayer.js, jwplayer.html5.js, jwplayer.flash.swf) will appear in the `bin-release` folder.

## Software License ##
The use of the JW Player Open Source edition is governed by a [Creative Commons license](http://creativecommons.org/licenses/by-nc-sa/3.0/). You can use, modify, copy, and distribute this edition as long as it’s for non-commercial use, you provide attribution, and share under a similar license.
http://www.jwplayer.com/license/

