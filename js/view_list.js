var ymt = ymt || {};

ymt.view = {

    constants: {
        NODE_STATUS: {
            NO_FAULT      : "Page info exists",
            NO_PAGE_INFO  : "No page info",
            NO_PAGE_TITLE : "No page title",
        },
        CHROME_NEWTAB: "chrome://newtab/",
    },

    edge_data: {},

    page_info: {},

    viewSummary: function(elem, title, image, desc) {
        console.log(title, image, desc);
    },

}


window.addEventListener('DOMContentLoaded', function(evt) {

    var nodes = [];
    var edges = [];

    var nodes_hash = {};
    var edges_hash = {};

    var stickyTop      = $('.sticky').offset().top;
    var original_width = $('.sticky').outerWidth();

    console.log(original_width);

    $(window).scroll(function(){
        var windowTop = $(window).scrollTop();
        if (stickyTop < windowTop) {
            $('.sticky')
                .css({ position: 'fixed', top: 0 });
        }
        else {
            $('.sticky')
                .css('position','static')
                .css("width", original_width);
        }
    });

    chrome.runtime.getBackgroundPage(function(eventPage) {

        // Set current concept name
        var concept_name = eventPage.bgraph.bg_page.data.concept_name;
        $(".current_concept_title").text(concept_name);

        var edge_data = eventPage.bgraph.bg_page.refined_data.edge_data;
        
        // Constants for node types in vis js
        var NODE_TYPE = "image";
        var ICON_URL  = "http://flyosity.com/images/_blogentries/networkicon/stepfinal2.png";
        var ICON_URL  = "http://iconlogisticsgh.com/wp-content/uploads/2014/04/globe.png";
        var MAX_CHAR  = 20;

        // Get data sources from background page
        var ds_edge         = eventPage.bgraph.bg_page.data.edge;
        var ds_page_info    = eventPage.bgraph.bg_page.data.page_info;
        var ds_stack        = eventPage.bgraph.bg_page.data.stack;
        var ds_origin       = eventPage.bgraph.bg_page.data.origin;

        ymt.view.page_info  = ds_page_info;

        var res_list = document.getElementById("res_list");
        
        res_list.style.visibility = "hidden";

        Object.keys(ds_page_info).forEach(function(k, ki){
            var div  = document.createElement("div");
            var attr = document.createAttribute("class");
            var attr_url = document.createAttribute("url_data");
            var attr_onclick = document.createAttribute("onclick");
            attr.value = "grid-item";
            attr_onclick.value = "ymt.view.viewSummary(this, 'T', 'P', 'O');";
            attr_url.value = ds_page_info[k].page_url;
            
            div.setAttributeNode(attr);
            div.setAttributeNode(attr_url);
            //div.setAttributeNode(attr_onclick);
            
            var image = ds_page_info[k].image;
            var title = ds_page_info[k].page_title;

            div.innerHTML = "<img src=\"" + image + "\" width=\"100%\"/><div><span style=\"font-size:12px;\">" + 
                            title + "</span></div>";
            
            if (title) {
                res_list.appendChild(div);
            }

            if (ki == Object.keys(ds_page_info).length-1) {
                setTimeout(function() {
                    var elem = document.querySelector('.grid');
                    var msnry = new Masonry( elem, {
                      // options
                      itemSelector: '.grid-item',
                      columnWidth: 200
                    });

                    var msnry = new Masonry( '.grid', {
                      // options
                    });

                    res_list.style.visibility = "visible";

                    var loading_icons = document.getElementsByClassName("loading_icon_container");
                    Object.keys(loading_icons).forEach(function(ind) {
                        loading_icons[ind].style.display = "none";
                    });

                    document.getElementById("mynetwork").style.height = "100%";

                }, 500);
            }

        });

        var gitems = document.getElementsByClassName("grid-item");
        var selected = undefined;

        for (var i=0; i < gitems.length; i++) {
            gitems[i].onclick = function(evt){
            var page = ds_page_info[this.getAttribute("url_data")];

            if (selected) {
                selected.style.background = "#fff";
            }
            selected = this;
            this.style.background = "#99c2ff";

            document.getElementById("no_summary_info_container").style.display = "none";
            document.getElementById("url_summary_table").style.display = null;

            document.getElementById("main_url_image").setAttribute("src", page.image);
            document.getElementById("main_url_title").innerHTML = "<a href=\"#\">" + page.page_title + "</a>";
            document.getElementById("main_url_description").innerHTML = page.description;

            // Incoming and outgoing links

            var incoming = document.getElementById("main_url_incoming");
                var outgoing = document.getElementById("main_url_outgoing");

                var incoming_container = document.getElementById("main_url_incoming_container");
                incoming_container.style.display = null;

                var outgoing_container = document.getElementById("main_url_outgoing_container");
                outgoing_container.style.display = null;

                incoming.innerHTML = "";
                outgoing.innerHTML = "";

                var e = edge_data[page.page_url];

                console.log(edge_data);

                if (e) {

                    // Render incoming links

                    e.incoming.forEach(function(url) {
                        if (url !== ymt.view.constants.CHROME_NEWTAB) {
                            var div  = document.createElement("div");
                            var attr = document.createAttribute("class");
                            attr.value = "container rel_link_container";
                            div.setAttributeNode(attr);
                            
                            div.innerHTML = "<div class=\"row\"><div class=\"col-md-1\" style=\"padding-left:5px; " + 
                                            "padding-right:0px; padding-top:0px;\"><img src=\"" + 
                                            (ds_page_info[url].favicon) + "\" width=\"16px\" height=\"16px\" />" + 
                                            "</div><div class=\"col-md-11\" style=\"padding-left:0px; padding-right:" + 
                                            "0px;\"><a href=\"#\">" + (ds_page_info[url].page_title || url) + 
                                            "</a></div></div>";
                            
                            incoming.appendChild(div);
                        }
                    });

                    // Render outgoing links

                    e.outgoing.forEach(function(url) {
                        var div  = document.createElement("div");
                        var attr = document.createAttribute("class");
                        attr.value = "container rel_link_container";
                        div.setAttributeNode(attr);
                        
                        div.innerHTML = "<div class=\"row\"><div class=\"col-md-1\" style=\"padding-left:5px; " + 
                                        "padding-right:0px; padding-top:0px;\"><img src=\"" + 
                                        (ds_page_info[url].favicon) + "\" width=\"16px\" height=\"16px\" />" + 
                                        "</div><div class=\"col-md-11\" style=\"padding-left:0px; padding-right:" + 
                                        "0px;\"><a href=\"#\">" + (ds_page_info[url].page_title || url) + 
                                        "</a></div></div>";
                        
                        outgoing.appendChild(div);
                    });

                    // No incoming or just a root as incoming node, thus hide the incoming links section
                    if ((e.incoming.length == 0) || (e.incoming.length == 1 && 
                        e.incoming[0] === ymt.view.constants.CHROME_NEWTAB)) {
                        
                        incoming_container.style.display = "none";
                    }

                    // No outgoing node, thus hide the outgoing links section
                    if (e.outgoing.length == 0) {
                        outgoing_container.style.display = "none";
                    }
                }
            };
        }

    });
    
});

