/**
 * AJAX File loading capabilities
 *
 * @author pablo
 * @version 6.0
 */
(function(utils) {

	/** Loads an XML file into a DOM object * */
	utils.ajax = function(xmldocpath, completecallback, errorcallback) {
		var xmlhttp;
		if (window.XMLHttpRequest) {
			// IE>7, Firefox, Chrome, Opera, Safari
			xmlhttp = new XMLHttpRequest();
		} else {
			// IE6
			xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
		}
		xmlhttp.onreadystatechange = function() {
			if (xmlhttp.readyState === 4) {
				if (xmlhttp.status === 200) {
					if (completecallback) {
						// Handle the case where an XML document was returned with an incorrect MIME type.
						if (!utils.exists(xmlhttp.responseXML)) {
							try {
								if (window.DOMParser) {
									var parsedXML = (new DOMParser()).parseFromString(xmlhttp.responseText,"text/xml");
									if (parsedXML) {
										xmlhttp = utils.extend({}, xmlhttp, {responseXML:parsedXML});
									}
								} else { 
									// Internet Explorer
									parsedXML = new ActiveXObject("Microsoft.XMLDOM");
									parsedXML.async="false";
									parsedXML.loadXML(xmlhttp.responseText);
									xmlhttp = utils.extend({}, xmlhttp, {responseXML:parsedXML});									
								}
							} catch(e) {
								if (errorcallback) {
									errorcallback(xmldocpath);
								}
							}
						}
						completecallback(xmlhttp);
					}
				} else {
					if (errorcallback) {
						errorcallback(xmldocpath);
					}
				}
			}
		};
		try {
			xmlhttp.open("GET", xmldocpath, true);
			xmlhttp.send(null);
		} catch (error) {
			if (errorcallback) {
				errorcallback(xmldocpath);
			}
		}
		return xmlhttp;
	};
	
})(jwplayer.utils);
