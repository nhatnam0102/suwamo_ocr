$("#btn_predict").off("click").on("click", function(e) {
    
    $("#process_modal").modal("show");
    hideAll(
      $(".contain1"),
      $(".contain2"),
      $(".contain3"),

    );
    showOne($(".contain1"))

    e.preventDefault(); 

    $.ajax({
        url: "/predict", 
        type: "POST", 
        data: null, 
        success: function(response) {
          
          hideAll(
            $(".contain1"),
            $(".contain2"),
            $(".contain3"),
      
          );
          showOne($(".contain2"))
        },
        error: function(xhr, status, error) {
           
          hideAll(
            $(".contain1"),
            $(".contain2"),
            $(".contain3"),
      
          );
          showOne($(".contain3"))
        }
    });
    });

    
function hideAll(...elements) {
  elements.forEach((element) => {
    if (element !== undefined || element != null) {
      element.removeClass("d-none").addClass("d-none");
    }
  });
}
function showOne(element) {
  element.removeClass("d-none");
}

$("#open_folder").off("click").on("click", function(e) {
 
  e.preventDefault(); 
  $.ajax({
    url: "/open_folder",
    type: "POST",
    contentType: "application/json", // Set content type to JSON
    data: JSON.stringify({
        predict_path: $("#predict_path").val()
    }),
    success: function(response) {
        // Handle success response if needed
    },
    error: function(xhr, status, error) {
        // Handle error response if needed
    }
});
  });
