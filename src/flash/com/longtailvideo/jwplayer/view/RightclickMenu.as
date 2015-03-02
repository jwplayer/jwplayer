package com.longtailvideo.jwplayer.view {

import flash.ui.ContextMenu;

public class RightclickMenu {

    public function RightclickMenu() {
        _context = new ContextMenu();
        _context.hideBuiltInItems();
    }

    private var _context:ContextMenu;

    public function get context():ContextMenu {
        return _context;
    }
}
}