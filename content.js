console.log("Content JS starts.");

// Description

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

// Image

var default_image = "http://p2cdn4static.sharpschool.com/UserFiles/Servers/Server_3145767/Image/Computer-Network-Technology.jpg";

var image = document.getElementsByTagName("meta");
var image = Object.keys(image).map(function(k) { 
    return image[k]; 
});
var img_meta = image.filter(function(x) { 
    var attr_property = x.getAttribute("property");

    return (attr_property !== null && attr_property === "og:image");
});
if (img_meta.length > 0) {
    var ideal = img_meta[0].getAttribute("content");
}

chrome.runtime.sendMessage({
    "page_url"      : document.location.href,
    "page_title"    : document.title,
    "description"   : description,
    "image"         : ideal || default_image
});

console.log("Content JS ends.");