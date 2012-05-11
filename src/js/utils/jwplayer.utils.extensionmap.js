/**
 * JW Player Media Extension to Mime Type mapping
 *
 * @author zach
 * @modified pablo
 * @version 6.0
 */
(function(utils) {
	var video = "video/", 
		audio = "audio/",
		image = "image",
		mp4 = "mp4",
		
		html5Extensions = {
			"f4a": audio+mp4,
			"f4b": audio+mp4,
			"f4v": video+mp4,
			"mov": video+"quicktime",
			"m4a": audio+mp4,
			"m4b": audio+mp4,
			"m4p": audio+mp4,
			"m4v": video+mp4,
			"mp4": video+mp4,
			"aac": audio+"aac",
			"mp3": audio+"mp3",
			"ogg": audio+"ogg",
			"oga": audio+"ogg",
			"ogv": video+"ogg",
			"webm": video+"webm",
			"m3u8": audio+"x-mpegurl",
			"wav": audio+"x-wav"
		}, 
		video = "video", 
		flashExtensions = {
			"flv": video,
			"f4b": video,
			"f4v": video,
			"mov": video,
			"m4a": video,
			"m4v": video,
			"mp4": video,
			"aac": video,
			"mp3": "sound",
			"gif": image,
			"jpeg": image,
			"jpg": image,
			"swf": image,
			"png": image,
			"rtmp": "rtmp",
			"hls": "hls"
		};
	
	var _extensionmap = utils.extensionmap = {};
	for (var ext in html5Extensions) {
		_extensionmap[ext] = { html5: html5Extensions[ext] };
	}
	for (ext in flashExtensions) {
		if (!_extensionmap[ext]) _extensionmap[ext] = {};
		_extensionmap[ext].flash = flashExtensions[ext];
	}

})(jwplayer.utils);
