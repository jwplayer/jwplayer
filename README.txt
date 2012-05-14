The JW Player is free for non-commerical use.  To buy a license for commercial use, please visit 
https://www.longtailvideo.com/players/order.

To build the JW Player, you will need the following software:

 * Flex SDK 4.1: http://sourceforge.net/adobe/flexsdk/wiki/Downloads/
 * Ant 1.7.0: http://ant.apache.org/bindownload.cgi

=== Compiling the Player With the Flex SDK and Ant ===

To compile with Flex and Ant, you'll first need to modify the build.properties file found in the 'build' folder.  

ant -buildfile build\build.xml

If the build is successful, the new player assets (jwplayer.js, jwplayer.html5.js, jwplayer.flash.swf) will appear in the base folder (where this README.txt file is located)

=== Compiling the flash component with Flash Builder ===

If you're using Flash Builder, you may use the following method to build the Flash player component (jwplayer.flash.swf):

1. Create a new ActionScript project (you can give it any name except "Player").
2. Under "Project Contents", uncheck "Use default location" and select the checkout tree (the folder where this README file lives).
3. Click the "Next" button, then type "src/flash" into the "Main Source Folder" field.
4. Click "Add SWC Folder" button.  Type in "libs" then press the "OK" button. 
5. Click the "Finish" button
6. Right-click on your new project, and select "Properties"
7. Under the "ActionScript Compiler" tab, click the radio button that reads "Use a specific version", and make sure it reads "10.0.0".
8. Click the "OK" button.
9. In the project source tree, navigate to the foler: src -> flash -> com -> longtailvideo -> jwplayer -> player
10. Right click on Player.as and select "Set as Default Application"
11. Under the "Project" menu, choose "Export Release Build".
12. Make sure "Player.as" is selected as the application, and click "Finish"
13. The flash component will be compiled as bin-release/Player.swf.