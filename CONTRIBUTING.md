# Contributing to JW Player
Thanks for considering contributing to our repo! We appreciate all contributions to the player, large or small. Please take the time to read through this document before making a contribution to ensure a fun and effective process for everyone involved.

## General Guidelines
Are you having trouble getting started with JW Player, configuration, or customization? If so, please check the [support docs](https://support.jwplayer.com/) before submitting an issue here. 

As contributors and maintainers of this repo, we'll do our best to help you out as soon as we can - however, we ask you to be respectful of our time. Our team is based in NYC and works in EST time, Monday - Friday. If your issue has been around for a while and hasn't been responded to, feel free to ping @johnBartos in the comment of your issue.

## Official Support
This guide is focused specifically for developers contributing towards this open-source project. If you pay for JW Player, you're entitled to direct help from our support team [here](https://support.jwplayer.com/customer/portal/emails/new).

## Bug Reports
A bug is a *demonstrable* problem caused by code in the repository. Bug reports are very helpful! If you think you've found a bug in the player we'd love to know about it (and fix it).

#### Hold Up!
Before submitting an issue, please do your best to confirm that your issue is *reproducible* and a problem with our player by running through this checklist. Afterwards, if you're still unsure about the cause of your problem, please feel free to submit an issue and we'll do our best to help. For issues building & developing the player, skip this guide and submit a report directly.

##### Issue Checklist
1. Check the console:
    - Are there any network errors (`404`, `403`, `500`, etc)?
    - Is there a CORS error (`access-control-allow-origin`)?
    - Are there errors thrown by third-party code?
2. Check your player:
    - Are you using the [latest version](https://developer.jwplayer.com/jw-player/docs/developer-guide/release_notes/release_notes_7)?
        - You can test streams with the latest version [here](https://developer.jwplayer.com/tools/stream-tester/).
    - Are you using Flash?
        - Ensure you're using the latest version of Flash.
        - We're in the process of deprecating Flash and will only fix
         critical bugs.
    - Is your [Configuration](https://developer.jwplayer.com/jw-player/docs/developer-guide/customization/configuration-reference/) valid?
3. Check your browser:
    - Are you using a [supported browser](https://support.jwplayer.com/customer/portal/articles/1403653-browser-device-reference#desktop
    )?
    - Are you using the latest version?
    - Does the browser support the feature you're trying to use?
    - Do we implement the feature you're using?
        - For example, we use native HLS playback where available (Safari, Edge, Mobile).
4. Check your OS (Mobile):
    - Are you using a [supported device](https://support.jwplayer.com/customer/portal/articles/1403653-browser-device-reference#mobile)?
    - Are you running the latest version?
5. Check your code:
    - Are you using a [supported media type](https://support.jwplayer.com/customer/portal/articles/1403635-media-format-reference)?
    - Are you using the [API](https://developer.jwplayer.com/jw-player/docs/developer-guide/api/javascript_api_reference/) correctly?
6. Check through our [issues](https://github.com/jwplayer/jwplayer/issues)
 and make sure your's isn't already reported or resolved.
 
 
#### You've Found an Issue
Great! Please [create an issue](https://github.com/jwplayer/jwplayer/issues/new) and follow the guidelines as best as you can - each ask gives us information necessary to solve your problem. If submitting a playback issue, make sure we can access your video at all times. If live, ensure that you provide us with the failing segments. And if you're able to, please isolate your issue by creating a standalone test page.

##### Test Page Template:
````
<html>
    <head>
        <script src='LINK_TO_YOUR_PLAYER'></script>
        <script>jwplayer.key='YOUR_KEY';</script>
    </head>
    <body>
        <div id="player">Loading the player...</div>
        <script>
            var player = jwplayer('player').setup({ ... });
        </script>
    </body>
</html>
````

## Pull Requests
Pull requests are a great way to help out and improve JW Player. Before embarking on a large PR, please ask us first - we may not need your changes in the repo and don't want you to waste your energy.

To get your repo up and running, please refer to BUILDING.md.

#### First Timers
If you've never contributed before, don't worry - we'll do the best we can to help you throughout the process. Unsure of where to begin? Check out our [beginner bugs](https://github.com/jwplayer/jwplayer/labels/beginner), or refer to the Questions/Discussions section and drop us a line. 

#### General Guidelines
While far from comprehensive, following these guidelines will get the easy stuff out of the way and speed the process along. In addition, please include a good description of what you've changed and why you've changed it.

##### Branch Naming
- Bugfixes: `bugfix/your-branch`
- Features: `feature/your-branch`
- Hotfixes: `hotfix/your-branch`

##### Style
1. **Code written must work across all supported browsers and devices without transpilation - Chrome, FF, Safari, Edge, and IE 9-11**
    - Usually this means writing in pure ES5, but ES6 features are allowed if they work everywhere
2. Ensure that your code follows our styleguide by passing our ESLint rules
3. Ensure that your code passes static analysis by running Flow
4. Do your best to match our naming conventions and conform to the style of the code around you
5. If you have a large or messy commit history, please rebase & squash your commit history

##### Tests
1. Ensure that all existing tests pass
2. We don't demand 100% coverage, but please write tests that cover at least the happy paths
    - Some code is hard to test or untestable - we won't hold it against you if you're working in a particularly difficult area. Just let us know if you've had some trouble
3. If your changes cannot be automated, include a manual test page that demonstrates the functionality of your changes

##### Size
1. Do your best to keep your PRs as small and focused as possible
    - If your PR is large, consider breaking it into smaller ones
2. **Large additions to the code base must be justified** - we strive to keep the player as small as possible
3. Additions to `package.json` must be backed by good reasons

## Feature Requests
Feature requests are also welcome, but may not fit within the scope of the player. It's up to you to make the case for your feature and convince us that it's worth implementing. We encourage you to try and solve your problem using the [API](https://developer.jwplayer.com/jw-player/docs/developer-guide/api/javascript_api_reference/) or [Configuration](https://developer.jwplayer.com/jw-player/docs/developer-guide/customization/configuration-reference/)  first. As always, you're free to fork the player and implement what you want - feel free to ask questions by following our Questions/Discussions guidelines.

## Questions/Discussions
We love to answer questions and talk with developers! Feel free to ask questions via [gitter](https://gitter.im/jwplayer/jwplayer?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge), the [video-dev-slack](https://video-dev.slack.com/messages/general/whats_new/), or by [creating an issue](https://github.com/jwplayer/jwplayer/issues/new) . And if you're in the NYC area, you can come and meet us and other video devs in the flesh  at the [Video Tech NYC Meetup](https://www.meetup.com/Video-Tech-NYC/).
    
    
