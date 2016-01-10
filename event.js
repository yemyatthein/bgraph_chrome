var bgraph = bgraph || {};

bgraph.bg_page = {
    
    _NS: {
        TAB_STACK  : "tab_stack___",
        TAB_ORIGIN : "tab_origin___",
        EDGE       : "edge___"
    },

    data: {
        stack     : {},
        origin    : {},
        page_info : {},
        edge      : {}
    },

    saveTabStack: function(tab) {
        var tab_stack = [];
        if (this.data.stack[this._NS.TAB_STACK + tab.id] !== undefined) {
            tab_stack = this.data.stack[this._NS.TAB_STACK + tab.id];
        }
        if (tab_stack.length > 0 && tab_stack[tab_stack.length-1].url === tab.url) {
            return;
        }
        tab_stack.push({"url": tab.url, created_time: Number(new Date())});
        if (tab_stack.length > 1) {
            var source = tab_stack[tab_stack.length-2].url;
            var target = tab_stack[tab_stack.length-1].url;

            this.data.edge[this._NS.EDGE + source + target] = {
                "source": source, "target": target,
                "source_tab_id": tab.id, "target_tab_id": tab.id};
        }
        this.data.stack[this._NS.TAB_STACK + tab.id] = tab_stack;
    }
};

chrome.tabs.onCreated.addListener(function(tab) {
    var objref = bgraph.bg_page;
    bgraph.bg_page.saveTabStack(tab);

    chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
        objref.data.origin[objref._NS.TAB_ORIGIN + tab.id] = tabs[0];
    });
});

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse)  { 
    var objref = bgraph.bg_page;
    
    objref.saveTabStack(sender.tab);
    objref.data.page_info[sender.tab.url] = message;

    var tab_origin = objref.data.origin[objref._NS.TAB_ORIGIN + sender.tab.id];
    if (tab_origin !== undefined && tab_origin.id !== sender.tab.id) {
        var source          = tab_origin.url;
        var target_tabstack = objref.data.stack[objref._NS.TAB_STACK + sender.tab.id];
        var target          = target_tabstack[target_tabstack.length-1].url;

        objref.data.edge[objref._NS.EDGE + source + target] = {
            "source": source, "target": target,
            "source_tab_id": tab_origin.id, "target_tab_id": sender.tab.id};
    }
});

chrome.tabs.onReplaced.addListener(function(new_tab_id, old_tab_id) {
    var objref = bgraph.bg_page;

    var tab_stack = [];
    if (objref.data.stack[objref._NS.TAB_STACK + new_tab_id] !== undefined) {
        tab_stack = objref.data.stack[objref._NS.TAB_STACK + new_tab_id];
    }
    tab_stack = [{"url": "___replaced___" + old_tab_id + "___", 
        "created_time": Number(new Date())}].concat(tab_stack);
    
    if (tab_stack.length > 1) {
        var source = tab_stack[0].url;
        var target = tab_stack[1].url;
        objref.data.edge[objref._NS.EDGE + source + target] = {
            "source": source, "target": target,
            "source_tab_id": new_tab_id, "target_tab_id": new_tab_id};
    }

    objref.data.stack[bgraph.bg_page._NS.TAB_STACK + new_tab_id] = tab_stack;
});


// Dev Notes:
// 
// new tab      : chrome/tab (0)
// replaced     : <replaced>
// cross tab    : origin
// 
// else, tab  1-2 links <- dummies










