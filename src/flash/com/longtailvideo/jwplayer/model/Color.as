package com.longtailvideo.jwplayer.model {
public class Color {
    public function Color(color:*) {
        if (color is String) {
            _color = stringToColor(color);
        } else if (color is uint || color is Number) {
            _color = color;
        } else if (color is Color) {
            _color = (color as Color).color;
        } else {
            throw(new Error("Invalid color option " + color));
        }
    }

    private var _color:uint;

    public function get color():uint {
        return _color;
    }

    public static function stringToColor(value:String):uint {
        switch (value.toLowerCase()) {
            case "blue":
                return 0x0000FF;
            case "green":
                return 0x00FF00;
            case "red":
                return 0xFF0000;
            case "cyan":
                return 0x00FFFF;
            case "magenta":
                return 0xFF00FF;
            case "yellow":
                return 0xFFFF00;
            case "black":
                return 0x000000;
            case "white":
                return 0xFFFFFF;
        }
        value = value.replace(/(#|0x)?([0-9A-F]{3,6})$/gi, "$2");
        if (value.length == 3) {
            value = value.charAt(0) + value.charAt(0) +
            value.charAt(1) + value.charAt(1) +
            value.charAt(2) + value.charAt(2);
        }
        return uint("0x" + value);
    }

    public function toString():String {
        var colorString:String = ((_color == 0) ? "000000" : _color.toString(16));
        while (colorString.length < 6) {
            colorString = "0" + colorString;
        }
        return "0x" + colorString;
    }
}
}