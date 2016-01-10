var bgraph = bgraph || {};

bgraph.background_page = {
    id_origins : {},
    session_ns : "YMT___",

    KeyBuilder : function(type, wrapped_key) {
        var _NS = {
            tab    : "tab___",
            link   : "link___",
            source : "source___",  
            target : "target___",
            _getType : function(k) { 
                if (this[k] !== undefined) { 
                    return this[k]; 
                }
                else { 
                    throw "Error: No type found - " + type; 
                }
            }
        };
        return (this.session_ns + _NS._getType(type) + wrapped_key);
    },

    updateSourceTarget : function(source, target) {
        if (localStorage.getItem(source) === null) {
            var targets = [target];
        } else {
            var targets = JSON.parse(localStorage.getItem(source));
            targets.push(target);
        }

        localStorage.setItem(source, JSON.stringify(targets));
    },

    updateLocalStorage : function(tab_id, tab) {
        var objref   = this;
        var new_link = undefined;
        var tab_key  = objref.KeyBuilder("tab", tab_id);

        if (localStorage.getItem(tab_key) === null) {
            var tab_history = [{"url": tab.url}];
            new_link        = true;
        } else {
            var tab_history = JSON.parse(localStorage.getItem(tab_key));
            if (tab_history[tab_history.length-1].url !== tab.url) {
                tab_history.push({"url": tab.url});
                new_link = true;
            }
        }

        if (new_link !== undefined) {
            localStorage.setItem(tab_key, JSON.stringify(tab_history));
            localStorage.setItem(objref.KeyBuilder("link", tab.url), JSON.stringify(tab));

            if (tab_history.length > 1) {
                var source = objref.KeyBuilder("source", tab_history[tab_history.length-2].url);
                var target = objref.KeyBuilder("target", tab_history[tab_history.length-1].url);
                objref.updateSourceTarget(source, target);
            }
        }
    }
};

/*
chrome.tabs.onUpdated.addListener(function (tab_id, change_info, tab) {

    if (tab.status === "complete") {
        
        tab_id_internal = bgraph.background_page.id_origins[tab_id] || tab_id;
        bgraph.background_page.updateLocalStorage(tab_id_internal, tab);

        chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
            if (tabs[0].id !== tab_id) {
                var source_tab_key      = bgraph.background_page.KeyBuilder("tab", bgraph.background_page.id_origins[tabs[0].id] || tabs[0].id);
                var source_tab_history  = JSON.parse(localStorage.getItem(source_tab_key));
                var source = bgraph.background_page.KeyBuilder("source", source_tab_history[source_tab_history.length-1].url);

                var target_tab_key      = bgraph.background_page.KeyBuilder("tab", bgraph.background_page.id_origins[tab_id] || tab_id);
                var target_tab_history  = JSON.parse(localStorage.getItem(target_tab_key));
                var target = bgraph.background_page.KeyBuilder("target", target_tab_history[target_tab_history.length-1].url);
                
                bgraph.background_page.updateSourceTarget(source, target);
            }
        });
    }

});

chrome.tabs.onReplaced.addListener(function(new_tab_id, old_tab_id) {

    // TODO: current tab is loading and title may not be ready
    chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
        bgraph.background_page.id_origins[new_tab_id] = bgraph.background_page.id_origins[old_tab_id] || old_tab_id;
        bgraph.background_page.updateLocalStorage(bgraph.background_page.id_origins[new_tab_id], tabs[0]);
    });

});
*/

var bgraph = bgraph || {};

bgraph.bg_page = {
    data: {
        stack: {},
        origin: {},
        edges: []
    },
    
    saveTabStack: function(tab) {
        var tab_stack = [];
        if (data.stack["tab_stack_" + tab.id] !== undefined) {
            tab_stack = data.stack["tab_stack_" + tab.id];
        }
        if (tab_stack.length > 0 && tab_stack[tab_stack.length-1] === tab.url) {
            return;
        }
        tab_stack.push(tab.url);
        if (tab_stack.length > 1) {
            var source = tab_stack[tab_stack.length-2];
            var target = tab_stack[tab_stack.length-1];
            data.edges.push({"source": source, "target": target});
        }
        data.stack["tab_stack_" + tab.id] = tab_stack;
    }
};

chrome.tabs.onCreated.addListener(function(tab) {
    console.log('on_created', tab);

    saveTabStack(tab);

    chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
        console.log('on_created/sender_tab', tab);
        console.log('on_created/active_tab', tabs[0]);
        data.origin["tab_" + tab.id + "_origin"] = tabs[0];
    });
});

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse)  { 
    console.log("message_receives", message, sender);

    saveTabStack(sender.tab);

    chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
        console.log('message_receives/ACTIVE_TAB', tabs[0]);
    });

    if (data.origin["tab_" + sender.tab.id + "_origin"] !== undefined && data.origin["tab_" + sender.tab.id + "_origin"].id !== sender.tab.id) {
        console.log("message_receives/origin_exists", data.origin["tab_" + sender.tab.id + "_origin"]);

        var source          = data.origin["tab_" + sender.tab.id + "_origin"].url;
        var target_tabstack = data.stack["tab_stack_" + sender.tab.id];
        var target          = target_tabstack[target_tabstack.length-1];

        data.edges.push({"source": source, "target": target});
    }
});

chrome.tabs.onReplaced.addListener(function(new_tab_id, old_tab_id) {
    console.log('on_replaced', old_tab_id, new_tab_id);
});













