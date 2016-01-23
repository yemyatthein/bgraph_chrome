var bgraph = bgraph || {};

// Initialize

localStorage.setItem("bgraph.bg_page.data.stack", "{}");
localStorage.setItem("bgraph.bg_page.data.origin", "{}");
localStorage.setItem("bgraph.bg_page.data.page_info", "{}");
localStorage.setItem("bgraph.bg_page.data.edge", "{}");

console.log("Data Initialized.");

bgraph.debug = {
    printData: function() {
        var data = {
            stack       : JSON.parse(localStorage.getItem("bgraph.bg_page.data.stack")),
            origin      : JSON.parse(localStorage.getItem("bgraph.bg_page.data.origin")),
            page_info   : JSON.parse(localStorage.getItem("bgraph.bg_page.data.page_info")),
            edge        : JSON.parse(localStorage.getItem("bgraph.bg_page.data.edge"))
        };
        console.log(data);
    }
};

bgraph.bg_page = {
    
    _NS: {
        TAB_STACK  : "tab_stack___",
        TAB_ORIGIN : "tab_origin___",
        EDGE       : "edge___"
    },

    getDataStore: function(category) {
        return JSON.parse(localStorage.getItem("bgraph.bg_page.data." + category));
    },

    setDataStore: function(category, data) {
        localStorage.setItem("bgraph.bg_page.data." + category, JSON.stringify(data));
    },

    saveTabStack: function(tab) {
        var tab_stack = [];

        var ds_stack  = this.getDataStore("stack");
        var ds_edge   = this.getDataStore("edge");

        if (ds_stack[this._NS.TAB_STACK + tab.id] !== undefined) {
            tab_stack = ds_stack[this._NS.TAB_STACK + tab.id];
        }
        if (tab_stack.length > 0 && tab_stack[tab_stack.length-1].url === tab.url) {
            return;
        }
        tab_stack.push({
            url: tab.url, 
            created_time: Number(new Date())
        });
        if (tab_stack.length > 1) {
            var source = tab_stack[tab_stack.length-2].url;
            var target = tab_stack[tab_stack.length-1].url;

            ds_edge[this._NS.EDGE + source + target] = {
                source        : source, 
                target        : target,
                source_tab_id : tab.id, 
                target_tab_id : tab.id
            };
        }
        ds_stack[this._NS.TAB_STACK + tab.id] = tab_stack;

        this.setDataStore("stack", ds_stack);
        this.setDataStore("edge", ds_edge);
    }
};

// When a tab is created
chrome.tabs.onCreated.addListener(function(tab) {

    var objref = bgraph.bg_page;
    bgraph.bg_page.saveTabStack(tab);

    // Save current active tab quickly, as an origin of the created tab,
    // It may be the same tab
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, function (tabs) {
        var ds_origin = objref.getDataStore("origin");
        ds_origin[objref._NS.TAB_ORIGIN + tab.id] = tabs[0];
        objref.setDataStore("origin", ds_origin);
    });
});

// When content script sends a message after page load
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse)  { 
    var objref = bgraph.bg_page;

    var ds_stack     = objref.getDataStore("stack");
    var ds_origin    = objref.getDataStore("origin");
    var ds_page_info = objref.getDataStore("page_info");
    var ds_edge      = objref.getDataStore("edge");
    
    objref.saveTabStack(sender.tab);
    ds_page_info[sender.tab.url] = message;

    // When the tab has origin, save edge between links of the two
    var tab_origin = ds_origin[objref._NS.TAB_ORIGIN + sender.tab.id];
    if (tab_origin !== undefined && tab_origin.id !== sender.tab.id) {
        var source          = tab_origin.url;
        var target_tabstack = ds_stack[objref._NS.TAB_STACK + sender.tab.id];
        var target          = target_tabstack[target_tabstack.length-1].url;

        ds_edge[objref._NS.EDGE + source + target] = {
            "source": source, "target": target,
            "source_tab_id": tab_origin.id, "target_tab_id": sender.tab.id
        };
    }

    objref.setDataStore("stack", ds_stack);
    objref.setDataStore("origin", ds_origin);
    objref.setDataStore("page_info", ds_page_info);
    objref.setDataStore("edge", ds_edge);
});

// When a tab is replaced internally
chrome.tabs.onReplaced.addListener(function(new_tab_id, old_tab_id) {
    var objref = bgraph.bg_page;

    var ds_stack = objref.getDataStore("stack");
    var ds_edge  = objref.getDataStore("edge");

    // If tab is a replaced one, put an indicator for later retrieval,
    // Add an edge between the indicator and first link in the tab stack
    var tab_stack = [];
    if (ds_stack[objref._NS.TAB_STACK + new_tab_id] !== undefined) {
        tab_stack = ds_stack[objref._NS.TAB_STACK + new_tab_id];
    }
    tab_stack = [{
        url          : "___replaced___" + old_tab_id + "___", 
        created_time : Number(new Date())
    }].concat(tab_stack);
    
    if (tab_stack.length > 1) {
        var source = tab_stack[0].url;
        var target = tab_stack[1].url;
        ds_edge[objref._NS.EDGE + source + target] = {
            source          : source, 
            target          : target,
            source_tab_id   : new_tab_id, 
            target_tab_id   : new_tab_id
        };
    }

    ds_stack[bgraph.bg_page._NS.TAB_STACK + new_tab_id] = tab_stack;

    objref.setDataStore("stack", ds_stack);
    objref.setDataStore("edge", ds_edge);
});


// Dev Notes:
// 
// new tab      : chrome/tab (0)
// replaced     : <replaced>
// cross tab    : origin
// 
// else, tab  1-2 links <- dummies










