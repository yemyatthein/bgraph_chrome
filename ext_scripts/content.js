// Get description

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

// Get image

var DEFAULT_IMAGE = "http://www.tampabay.com/resources/images/dti/rendered/2015/09/tbw_meditationb092515_15944893_8col.jpg";

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

// Get favicon

DEFAULT_FAVICON = "http://flyosity.com/images/_blogentries/networkicon/stepfinal2.png";

var favicon = DEFAULT_FAVICON;

var links = document.getElementsByTagName("link");
var links = Object.keys(links).map(function(k) { 
    return links[k]; 
});
links.forEach(function(link) {
    var type = link.getAttribute("type");
    if (type === "image/png" || type === "image/x-icon") {
        var href = link.getAttribute("href");
        if (href.startsWith("http")) {
            favicon = href;
            console.log("In-loop, Favicon is ", favicon);
        }
    }
});

console.log("Finally, Favicon is ", favicon);

// Now send page information to background page
chrome.runtime.sendMessage({
    page_url      : document.location.href,
    page_title    : document.title,
    description   : description,
    image         : ideal || DEFAULT_IMAGE,
    favicon       : favicon
});