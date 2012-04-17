/**
 * Video tag stuff
 * 
 * @author pablo
 * @version 6.0
 */
(function(jwplayerhtml5) {
	
  /** HTML5 video class * */
  jwplayerhtml5.video = function(videotag) {
	  
	  var _mediaEvents = {
		  "abort": _videoEventHandler,
		  "canplay": _canPlayHandler,
		  "canplaythrough": _videoEventHandler,
		  "durationchange": _videoEventHandler,
		  "emptied": _videoEventHandler,
		  "ended": _videoEventHandler,
		  "error": _errorHandler,
		  "loadeddata": _videoEventHandler,
		  "loadedmetadata": _videoEventHandler,
		  "loadstart": _videoEventHandler,
		  "pause": _videoEventHandler,
		  "play": _videoEventHandler,
		  "playing": _videoEventHandler,
		  "progress": _videoEventHandler,
		  "ratechange": _videoEventHandler,
		  "readystatechange": _videoEventHandler,
		  "seeked": _videoEventHandler,
		  "seeking": _videoEventHandler,
		  "stalled": _videoEventHandler,
		  "suspend": _videoEventHandler,
		  "timeupdate": _videoEventHandler,
		  "volumechange": _videoEventHandler,
		  "waiting": _videoEventHandler
	  };
	  
	  // Reference to the video tag
	  var _video;
	  // Whether seeking is ready yet
	  var _canSeek;
	  // If we should seek on canplay
	  var _delayedSeek;
	  
	  // Constructor
	  function _init(videotag) {
		_video = videotag;
		_setupListeners();
	  }
	  
	  function _setupListeners() {
		  for (var evt in _mediaEvents) {
			  _video.addEventListener(evt, _mediaEvents[evt]);
		  }
	  }
	  
	  function _videoEventHandler(evt) {
		  console.log("%s %o (%s,%s)", evt.type, evt, _bufferedStart(), _bufferedEnd());
	  }

	  function _canPlayHandler(evt) {
		  _canSeek = true;
		  _videoEventHandler(evt);
		  if (_delayedSeek > 0) {
			  _seek(_delayedSeek);
		  }
	  }
	  
	  function _errorHandler(evt) {
		  console.log("Error: %o", _video.error);
		  _videoEventHandler(evt);
	  }

	  function _bufferedStart() {
		 if (_video.buffered.length > 0)
			 return _video.buffered.start(0);
		 else
			 return 0;
	  }
	  
	  function _bufferedEnd() {
		  if (_video.buffered.length > 0)
			 return Math.ceil(_video.buffered.end(_video.buffered.length-1));
		  else
			 return 0;
	  }

	  var _file;
	  
	  this.load = function(videoURL) {
		  _canSeek = false;
		  _delayedSeek = 0;
		  _file = videoURL;
 		  _video.src = _file;
		  _video.load();
		  //_video.pause();
	  }
	  
	  this.stop = function() {
		  //_video.src = "";
		  _video.removeAttribute("src");
		  _video.load();
		  _video.style.display = "none";
	  }
	  
	  this.play = function() {
		  _video.style.display = "block";
		  _video.play();
	  }

	  this.pause = function() {
		  _video.pause();
	  }

	  var _seek = this.seek = function(pos) {
		  if (_canSeek) {
			  _delayedSeek = 0;
			  _video.play();
			  _video.currentTime = pos;
		  } else {
			  _delayedSeek = pos;
		  }
	  }

	  // Provide access to video tag
	  // TODO: remove
	  this.getTag = function() {
		  return videotag;
	  }
	  
	  // Call constructor
	  _init(videotag);
	  
  }
  
})(jwplayer.html5);