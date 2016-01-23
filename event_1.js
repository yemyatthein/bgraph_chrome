var bgraph = bgraph || {};

localforage.getItem("bgraph.bg_page.data").then(function(value) {
    bgraph.bg_page.persistData({
        stack     : {},
        origin    : {},
        page_info : {},
        edge      : {}
    });
    console.log("Datastore initialized.");
});

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

    persistData: function(data) {
        localforage.getItem("bgraph.bg_page.data")
            .then(function(current_data) {
                var current_data = current_data || {};
                Object.keys(data).forEach(function(k) {
                    current_data[k] = data[k];
                });
                return current_data;
            })
            .then(function(current_data) {
                console.log("Saving current_data", current_data);
                localforage.setItem("bgraph.bg_page.data", current_data);
            });
    },

    saveTabStackOriginal: function(tab) {
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

        this.saveTabStack2(tab);
    },

    saveTabStack: function(tab) {
        var objref = this;

        localforage.getItem("bgraph.bg_page.data")
            .then(function(data) {
                var tab_stack = [];
                
                if (data.stack[objref._NS.TAB_STACK + tab.id] !== undefined) {
                    tab_stack = data.stack[objref._NS.TAB_STACK + tab.id];
                }
                if (tab_stack.length > 0 && tab_stack[tab_stack.length-1].url === tab.url) {
                    return;
                }
                
                tab_stack.push({"url": tab.url, created_time: Number(new Date())});
                
                if (tab_stack.length > 1) {
                    var source = tab_stack[tab_stack.length-2].url;
                    var target = tab_stack[tab_stack.length-1].url;

                    data.edge[objref._NS.EDGE + source + target] = {
                        "source": source, "target": target,
                        "source_tab_id": tab.id, "target_tab_id": tab.id};
                }
                data.stack[objref._NS.TAB_STACK + tab.id] = tab_stack;

                return data;
            })
            .then(objref.persistData);

    }
};

// When a tab is created
chrome.tabs.onCreated.addListener(function(tab) {

    var objref = bgraph.bg_page;
    bgraph.bg_page.saveTabStack(tab);

    // Save current active tab quickly, as an origin of the created tab, May be the same tab
    chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
        localforage.getItem("bgraph.bg_page.data")
            .then(function(data) {
                data.origin[objref._NS.TAB_ORIGIN + tab.id] = tabs[0];
                return data;
            })
            .then(objref.persistData);
    });
});

// When content script sends a message after page load
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse)  { 
    var objref = bgraph.bg_page;
    
    objref.saveTabStack(sender.tab);

    localforage.getItem("bgraph.bg_page.data")
        .then(function(data) {
            data.page_info[sender.tab.url] = message;

            // When the tab has origin, save edge between links of the two
            var tab_origin = data.origin[objref._NS.TAB_ORIGIN + sender.tab.id];
            if (tab_origin !== undefined && tab_origin.id !== sender.tab.id) {
                var source          = tab_origin.url;
                var target_tabstack = data.stack[objref._NS.TAB_STACK + sender.tab.id];
                var target          = target_tabstack[target_tabstack.length-1].url;

                data.edge[objref._NS.EDGE + source + target] = {
                    "source": source, "target": target,
                    "source_tab_id": tab_origin.id, "target_tab_id": sender.tab.id
                };
            }

            return data;
        })
        .then(objref.persistData);
});

// When a tab is replaced internally
chrome.tabs.onReplaced.addListener(function(new_tab_id, old_tab_id) {
    var objref = bgraph.bg_page;

    localforage.getItem("bgraph.bg_page.data")
            .then(function(data) {
                // If tab is a replaced one, put an indicator for later retrieval,
                // Add an edge between the indicator and first link in the tab stack
                var tab_stack = [];
                if (data.stack[objref._NS.TAB_STACK + new_tab_id] !== undefined) {
                    tab_stack = data.stack[objref._NS.TAB_STACK + new_tab_id];
                }

                tab_stack = [{
                    "url": "___replaced___" + old_tab_id + "___", 
                    "created_time": Number(new Date())
                }].concat(tab_stack);

                if (tab_stack.length > 1) {
                    var source = tab_stack[0].url;
                    var target = tab_stack[1].url;
                    data.edge[objref._NS.EDGE + source + target] = {
                        "source": source, 
                        "target": target,
                        "source_tab_id": new_tab_id, 
                        "target_tab_id": new_tab_id};
                }

                data.stack[bgraph.bg_page._NS.TAB_STACK + new_tab_id] = tab_stack;

                return data;
            })
            .then(objref.persistData);
});


// Dev Notes:
// 
// new tab      : chrome/tab (0)
// replaced     : <replaced>
// cross tab    : origin
// 
// else, tab  1-2 links <- dummies










