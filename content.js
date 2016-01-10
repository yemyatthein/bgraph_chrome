console.log("Content JS starts.");

var meta = document.getElementsByTagName("meta");
var meta = Object.keys(meta).map(function(k) { 
    return meta[k]; 
});

var desc_meta = meta.filter(function(x) { 
    var attr_name     = x.getAttribute("name");
    var attr_property = x.getAttribute("property");

    return (attr_name === "description" || attr_property === "og:description" 
        || attr_property === "twitter:description");
});

var description = "Not Available";
if (desc_meta.length > 0) {
    description = desc_meta[0].getAttribute("content");
}

chrome.runtime.sendMessage({
    "page_url"      : document.location.href,
    "page_title"    : document.title,
    "description"   : description
});

console.log("Content JS ends.");