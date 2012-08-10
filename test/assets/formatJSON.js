// formatJson() :: formats and indents JSON string
function formatJson(val) {
	if (!val) val = '';
	var retval = '';
	var str = val;
    var pos = 0;
    var strLen = str.length;
	var indentStr = '&nbsp;&nbsp;&nbsp;&nbsp;';
    var newLine = '<br />';
	var char = '';
	
	for (var i=0; i<strLen; i++) {
		char = str.substring(i,i+1);
		
		if (char == '}' || char == ']') {
			retval = retval + newLine;
			pos = pos - 1;
			
			for (var j=0; j<pos; j++) {
				retval = retval + indentStr;
			}
		}
		
		retval = retval + char;	
		
		if (char == '{' || char == '[' || char == ',') {
			retval = retval + newLine;
			
			if (char == '{' || char == '[') {
				pos = pos + 1;
			}
			
			for (var k=0; k<pos; k++) {
				retval = retval + indentStr;
			}
		}
	}
	
	return retval.replace(/:/g, ": ");
}