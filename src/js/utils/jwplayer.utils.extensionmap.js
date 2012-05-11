/**
 * JW Player Media Extension to Mime Type mapping
 *
 * @author zach
 * @version 5.4
 */
(function(utils) {
	utils.extensionmap = {
		"3gp": {
			html5: "video/3gpp",
			flash: "video"
		},
		"3gpp": {
			html5: "video/3gpp"
		},
		"3g2": {
			html5: "video/3gpp2",
			flash: "video"
		},
		"3gpp2": {
			html5: "video/3gpp2"
		},
		"flv": {
			flash: "video"
		},
		"f4a": {
			html5: "audio/mp4"
		},
		"f4b": {
			html5: "audio/mp4",
			flash: "video"
		},
		"f4v": {
			html5: "video/mp4",
			flash: "video"
		},
		"mov": {
			html5: "video/quicktime",
			flash: "video"
		},
		"m4a": {
			html5: "audio/mp4",
			flash: "video"
		},
		"m4b": {
			html5: "audio/mp4"
		},
		"m4p": {
			html5: "audio/mp4"
		},
		"m4v": {
			html5: "video/mp4",
			flash: "video"
		},
		"mp4": {
			html5: "video/mp4",
			flash: "video"
		},
		"rbs":{
			flash: "sound"
		},
		"aac": {
			html5: "audio/aac",
			flash: "video"
		},
		"mp3": {
			html5: "audio/mp3",
			flash: "sound"
		},
		"ogg": {
			html5: "audio/ogg"
		},
		"oga": {
			html5: "audio/ogg"
		},
		"ogv": {
			html5: "video/ogg"
		},
		"webm": {
			html5: "video/webm"
		},
		"m3u8": {
			html5: "audio/x-mpegurl"
		},
		"gif": {
			flash: "image"
		},
		"jpeg": {
			flash: "image"
		},
		"jpg": {
			flash: "image"
		},
		"swf":{
			flash: "image"
		},
		"png":{
			flash: "image"
		},
		"wav":{
			html5: "audio/x-wav"
		}, 
		"rtmp":{
			flash: "rtmp"
		},
		"hls":{
			flash: "hls"
		}
	};
})(jwplayer.utils);
