# <img height="70px" src="http://www.jwplayer.com/wp-content/uploads/JWP-GitHub-Banner-1.png" alt="JW Player Logo" title="JW Player Logo"/>

[![Join the chat at https://gitter.im/jwplayer/jwplayer](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/jwplayer/jwplayer?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

> Plays everywhere, every time.
> 
> JW Player is -the- solution for making video playback seamless across browsers and file types. 
> It empowers the developer to interact with video programmatically to create unique and awesome user experiences.
 
[Developer API Examples and Demos](https://developer.jwplayer.com/jw-player/demos/)

[Documentation and Support](http://support.jwplayer.com/)


## Example

The example below will find the element with an id of *my_video* and render a video player into it. 

```js
    // Create a jwplayer instance
    jwplayer('my_video').setup({
        file: '/uploads/example.mp4',
    });

    // Add a custom callback for when user pauses playback
    jwplayer('my_video').on('pause', function(event) {
        alert('Why did my user pause their video instead of watching it?');
    });
```

Other callbacks that we provide include
* **play / complete**
* **seek / pause**
* **volume / mute**
* **[and more](http://support.jwplayer.com/customer/portal/topics/564475-javascript-api/articles)**

You also have the power to programatically set any configuration within the player. 

```js
    function bumpIt() {
    	var vol = player.getVolume();
        player.setVolume(vol + 10 );
    }
```

## Contributing

### Build Instructions

 1. Install [Node.js](https://nodejs.org/download)
 1. Install [Adobe AIR SDK](http://www.adobe.com/devnet/air/air-sdk-download.html)
 1. Install [Java](https://java.com/en/download/)
 1. Download [player.swc 11.2](http://fpdownload.macromedia.com/get/flashplayer/installers/archive/playerglobal/playerglobal11_2.swc)
 1. Rename and move the .swc file to ```{AIRSDK_Compiler}/frameworks/libs/player/11.2/playerglobal.swc```

```sh
    # First time set up
    npm install -g grunt
    npm install
    
    # Build using
    grunt
```

After build, the assets will be available in the `bin-release` folder.


## Software License
The use of this library is governed by a [Creative Commons license](http://creativecommons.org/licenses/by-nc-sa/3.0/). You can use, modify, copy, and distribute this edition as long as it’s for non-commercial use, you provide attribution, and share under a similar license.
http://www.jwplayer.com/license/

