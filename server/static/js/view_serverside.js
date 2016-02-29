window.addEventListener('DOMContentLoaded', function(evt) {

    // Get original and refined data

    var data_original = JSON.parse(decodeURIComponent(
        window.atob($("#data-original").val())));

    var data_refined = JSON.parse(decodeURIComponent(
        window.atob($("#data-refined").val())));

    // Call render function

    ymt.lib.renderGraph(data_refined.nodes, data_refined.edges,
                        data_refined.edge_data, 
                        data_original.page_info);
    
});

