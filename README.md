# <img height="70px" src="http://www.jwplayer.com/wp-content/uploads/JWP-GitHub-Banner-1.png" alt="JW Player Logo" title="JW Player Logo"/>

> Plays everywhere, every time.
> 
> JW Player is -the- open source solution for making video playback seamless across browsers and file types. 
> It empowers the developer to interact with video programmatically to create unique and awesome user experiences.
 
[Code Examples](http://support.jwplayer.com/customer/portal/topics/564475-javascript-api/articles)

[Documentation and Support](http://support.jwplayer.com/)


## Example

The example below will find the element with an id of *my_video* and render a video player into it. 

```js
    // Create a jwplayer instance
	jwplayer('my_video').setup({
		file: '/uploads/example.mp4',
	});

    // Add a custom callback for when user pauses playback
	jwplayer('my_video').onPause(function(event) {
        alert('Why did my user pause their video instead of watching it?');
	});
```

Other callbacks that we provide include
* **onComplete**
* **onSeek**
* **onVolume**
* **[and more](http://support.jwplayer.com/customer/portal/topics/564475-javascript-api/articles)**

You also have the power to programatically set any configuration within the player. 

```js
    function bumpIt() {
        player.setVolume( player.getVolume() + 10 );
    }
```

## Contributing

### Build Instructions

 1. Install [Node.js](https://nodejs.org/download)
 1. Install [Adobe AIR SDK](http://www.adobe.com/devnet/air/air-sdk-download.html)
 1. Download [player.swc 11.1](http://fpdownload.macromedia.com/get/flashplayer/installers/archive/playerglobal/playerglobal11_1.swc)
 1. Place the player.swc file into ```{AIRSDK_Compiler}/frameworks/libs/player/11.1/playerglobal.swc```
 1. Modify your flex-config.xml file to use target player 11.1

```sh
    # First time set up
    npm install
    
    # Build using
    grunt
```

After build, the assets will be available in the `bin-release` folder.

## Software License
The use of the JW Player Open Source edition is governed by a [Creative Commons license](http://creativecommons.org/licenses/by-nc-sa/3.0/). You can use, modify, copy, and distribute this edition as long as it’s for non-commercial use, you provide attribution, and share under a similar license.
http://www.jwplayer.com/license/

