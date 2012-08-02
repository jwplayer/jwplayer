
/** get primary cookie. **/
var primaryCookie = 'html5';
var cookies = document.cookie.split(";");
for (i=0; i < cookies.length; i++) {
    var x = cookies[i].substr(0, cookies[i].indexOf("="));
    var y = cookies[i].substr(cookies[i].indexOf("=") + 1);
    x = x.replace(/^\s+|\s+$/g,"");
    if (x == 'primaryCookie') {
        primaryCookie = y;
    }
}
setTimeout(addSwitch,100);



/** Set primary cookie. **/
function switchCookie() { 
    if(primaryCookie == 'html5') { 
        primaryCookie = 'flash';
    } else { 
        primaryCookie = 'html5'
    }
    document.cookie = "primaryCookie=" + primaryCookie;
    window.location.reload();
};

/** Insert a switch. **/
function addSwitch() {
    var list = document.getElementsByTagName('div')[0];
    var secondary = "flash";
    if(primaryCookie == 'flash') { secondary = "html5"; }
    list.innerHTML = '<a href="javascript:switchCookie()">switch primary to '+secondary+'</a>';
};
