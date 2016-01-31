var bgraph = bgraph || {};


bgraph.bg_page = {

    NS: {
        TAB_STACK  : "tab_stack___",
        TAB_ORIGIN : "tab_origin___",
        EDGE       : "edge___",
        REPLACED   : "___replaced___"
    },

    data: {
        concept_name : undefined,
        stack        : {},
        origin       : {},
        page_info    : {},
        edge         : {}
    },

    endConcept: function() {
        this.data = {
            concept_name : undefined,
            stack        : {},
            origin       : {},
            page_info    : {},
            edge         : {}
        };
    },

    // Add provide tab into tab stack and add edge if the stack has more than 1 items.
    // If tab is already been captured recently, ignore it.
    // 
    saveTabStack: function(tab) {
        var tab_stack = [];
        if (this.data.stack[this.NS.TAB_STACK + tab.id] !== undefined) {
            tab_stack = this.data.stack[this.NS.TAB_STACK + tab.id];
        }

        // Same url is sent twice, no update required
        if (tab_stack.length > 0 && tab_stack[tab_stack.length-1].url === tab.url) {
            return;
        }

        // Push new url to the tab stack
        tab_stack.push({ url: tab.url, created_time: Number(new Date()) });
        
        // If the tab stack has already an item, add an edge
        if (tab_stack.length > 1) {
            var source = tab_stack[tab_stack.length-2].url;
            var target = tab_stack[tab_stack.length-1].url;

            this.data.edge[this.NS.EDGE + source + target] = {
                source          : source, 
                target          : target,
                source_tab_id   : tab.id, 
                target_tab_id   : tab.id
            };
        }

        // Update data
        this.data.stack[this.NS.TAB_STACK + tab.id] = tab_stack;
    }
};


// When a tab is created, save the tab into tab stack. Record current active tab in tab origin.
// This is to get where a tab is created from. (e.g. "Open in a New Tab" case)
// 
chrome.tabs.onCreated.addListener(function(tab) {

    var objref = bgraph.bg_page;

    // Save new tab to tab stack
    bgraph.bg_page.saveTabStack(tab);

    // Save current  active tab quickly, as an origin of the newly created tab,
    // It may be the same tab or a different one
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, function (tabs) {
        objref.data.origin[objref.NS.TAB_ORIGIN + tab.id] = tabs[0];
    });
});


// When content script sends a message after page load (type="page_info"), save page information
// add sender tab in tab stack. If the sender has origin tab, add an edge between origin's url
// and sender url. ("Open in a New Tab" case)
// 
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse)  { 

    var objref = bgraph.bg_page;

    if (message.type === "page_info") {
        
        // Save tab information and page information
        objref.saveTabStack(sender.tab);
        objref.data.page_info[sender.tab.url] = message;

        // When the tab has origin, add and edge between links of the two
        var tab_origin = objref.data.origin[objref.NS.TAB_ORIGIN + sender.tab.id];
        if (tab_origin !== undefined && tab_origin.id !== sender.tab.id) {
            var source          = tab_origin.url;
            var target_tabstack = objref.data.stack[objref.NS.TAB_STACK + sender.tab.id];
            var target          = target_tabstack[0].url;

            objref.data.edge[objref.NS.EDGE + source + target] = {
                source          : source, 
                target          : target,
                source_tab_id   : tab_origin.id, 
                target_tab_id   : sender.tab.id
            };
        }
    }
    else if (message.type === "new_concept") {
        objref.data.concept_name = message.name;
    }
    else if (message.type === "end_concept") {
        objref.endConcept();
    }
});


// When a tab is replaced internally by Chrome, new tab is added to tab stack.
// A new special identifier "___relaced___<id>" is added at front of the tab 
// stack for refering back to old tab. The id is the old tab's identity.
// Since new tab is saved here, add an edge as well if the tab stack has more 
// than one items.
// 
chrome.tabs.onReplaced.addListener(function(new_tab_id, old_tab_id) {

    console.log("DEBUG: Tab " + old_tab_id + " is relaced by " + new_tab_id + ".");

    var objref = bgraph.bg_page;

    // If tab is a replaced one, put an indicator for later retrieval,
    // Add an edge between the indicator and first link in the tab stack
    var tab_stack = [];
    if (objref.data.stack[objref.NS.TAB_STACK + new_tab_id] !== undefined) {
        tab_stack = objref.data.stack[objref.NS.TAB_STACK + new_tab_id];
    }
    tab_stack = [{ 
        url          : objref.NS.REPLACED + old_tab_id + "___", 
        created_time : Number(new Date())
    }].concat(tab_stack);
    
    if (tab_stack.length > 1) {
        var source = tab_stack[0].url;
        var target = tab_stack[1].url;
        objref.data.edge[objref.NS.EDGE + source + target] = {
            source          : source, 
            target          : target,
            source_tab_id   : new_tab_id, 
            target_tab_id   : new_tab_id
        };
    }

    objref.data.stack[bgraph.bg_page.NS.TAB_STACK + new_tab_id] = tab_stack;
});


// Dev Notes:
// 
// new tab      : chrome/tab (0)
// replaced     : <replaced>
// cross tab    : origin
// 
// else, tab  1-2 links <- dummies

