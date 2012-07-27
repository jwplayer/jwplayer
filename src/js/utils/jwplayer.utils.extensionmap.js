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
		webm = "webm",
		aac = "aac",
		mp3 = "mp3",
		ogg = "ogg",
		
		mimeMap = {
			mp4: video+mp4,
			vorbis: audio+ogg,
			webm: video+webm,
			aac: audio+mp4,
			mp3: audio+mp3,
			hls: "application/vnd.apple.mpegurl"
		},
		
		html5Extensions = {
			"mp4": mimeMap[mp4],
			"f4v": mimeMap[mp4],
			"m4v": mimeMap[mp4],
			"mov": mimeMap[mp4],
			"m4a": mimeMap[aac],
			"f4a": mimeMap[aac],
			"aac": mimeMap[aac],
			"mp3": mimeMap[mp3],
			"ogg": mimeMap[ogg],
			"oga": mimeMap[ogg],
			"webm": mimeMap[webm],
			"m3u8": mimeMap.hls,
		}, 
		video = "video", 
		flashExtensions = {
			"flv": video,
			"f4v": video,
			"mov": video,
			"m4a": video,
			"m4v": video,
			"mp4": video,
			"aac": video,
			"mp3": "sound",
			"smil": "rtmp",
			"m3u8": "hls"
		};
	
	var _extensionmap = utils.extensionmap = {};
	for (var ext in html5Extensions) {
		_extensionmap[ext] = { html5: html5Extensions[ext] };
	}
	for (ext in flashExtensions) {
		if (!_extensionmap[ext]) _extensionmap[ext] = {};
		_extensionmap[ext].flash = flashExtensions[ext];
	}
	
	_extensionmap.mimeType = function(mime) {
		for (var type in mimeMap) {
			if (mimeMap[type] == mime) return type;
		}
	}

})(jwplayer.utils);
