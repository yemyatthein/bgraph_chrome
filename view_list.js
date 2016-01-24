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
    
    chrome.runtime.getBackgroundPage(function(eventPage) {
        
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
            
            var image = ds_page_info[k].image; //"http://static.goal.com/2545400/2545482_heroa.jpg";
            var title = ds_page_info[k].page_title; //"No Nolito or new Neymar deal yet - the price of paying the MSN for Barcelona - Goal.com";

            div.innerHTML = "<img src=\"" + image + "\" width=\"100%\"/><div><span style=\"font-size:12px;\">" + title + "</span></div>";
            
            res_list.appendChild(div);

            if (ki == Object.keys(ds_page_info).length-1) {
                setTimeout(function() {
                    var elem = document.querySelector('.grid');
                    var msnry = new Masonry( elem, {
                      // options
                      itemSelector: '.grid-item',
                      columnWidth: 200
                    });

                    // element argument can be a selector string
                    //   for an individual element
                    var msnry = new Masonry( '.grid', {
                      // options
                    });

                    res_list.style.visibility = "visible";

                    var loading_icons = document.getElementsByClassName("loading_icon_container");
                    Object.keys(loading_icons).forEach(function(ind) {
                        loading_icons[ind].style.display = "none";
                    });

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
             this.style.background = "#D7C7B0";

             document.getElementById("no_summary_info_container").style.display = "none";
             document.getElementById("url_summary_table").style.display = null;
             
             document.getElementById("main_url_image").setAttribute("src", page.image);
             document.getElementById("main_url_title").innerHTML = "<a href=\"#\">" + page.page_title + "</a>";
             document.getElementById("main_url_description").innerHTML = page.description;
        };
    }

    });
    
});

