$('.show-detail-btn').on('click', function() {
    var categoryId = $(this).data('category_id');
    window.location.href = `/template_detail?category_id=${encodeURIComponent(
        categoryId
      )}`;
   
  })

  let $images_file = $("#images_file");
  
let imgWidth;
let imgHeight;
imgWidth = $images_file.width();
imgHeight = $images_file.height();
$(function () {
    $("#bounding-box-container")
      .find(".bounding-box")
      .each(function () {
        var boundingBox = $(this);
        initBoundingBox(boundingBox);
      });
  });


  function initBoundingBox(boundingBox) {
    var xCenter = parseFloat(boundingBox.data("x_center"));
    var yCenter = parseFloat(boundingBox.data("y_center"));
    var width = parseFloat(boundingBox.data("width"));
    var height = parseFloat(boundingBox.data("height"));
  
    boundingBox.css({
      left: xCenter * imgWidth - (width * imgWidth) / 2 + "px",
      top: yCenter * imgHeight - (height * imgHeight) / 2 + "px",
      width: width * imgWidth + "px",
      height: height * imgHeight + "px",
    });
    //For double touch
    var tapped = false;
    boundingBox.on("touchstart", function (e) {
      if (!tapped) {
        //if tap is not set, set up single tap
        tapped = setTimeout(function () {
          tapped = null;
        }, 300);
        handlerOneClick(boundingBox); //wait 300ms then run single click code
      } else {
        //tapped within 300ms of last tap. double tap
        clearTimeout(tapped); //stop single tap callback
        tapped = null;
        selectedBox = boundingBox;
        handlerDoubleClick(boundingBox);
        e.preventDefault();
      }
    });
    //For click
    boundingBox.off("dblclick").on("dblclick", function () {
      handlerDoubleClick(boundingBox);
    });
    boundingBox.off("click").on("click", function (e) {
      handlerOneClick(boundingBox);
    });
  }
  function handleImageDoubleClick(event) {
    var container = $("#file-display");
  
    // Lấy vị trí của sự kiện click trên toàn trang (viewport)
    var xInViewport = event.clientX;
    var yInViewport = event.clientY;
  
    // Lấy kích thước của tấm ảnh và vị trí của nó trong viewport
    var containerOffset = container.offset();
    var relativeX = xInViewport - containerOffset.left + container.scrollLeft();
    var relativeY = yInViewport - containerOffset.top + container.scrollTop();
  
    let width = 100;
    let height = 50;
    var xCenter = (relativeX + width / 2) / imgWidth;
    var yCenter = (relativeY + height / 2) / imgHeight;
  
    var Width = width / imgWidth;
    var Height = height / imgHeight;
  
    // Show modal
    var modal = $("#myModal");
    modal.show();
  
  
    // Handle the click on the "Add Box" button inside the modal
    $("#addBoxButton").off('click').on("click", function () {
  
      let selectedFile = fileInput.files[0];
      let detectType =$('input[name="detectType"]:checked').val()
    
      if (!selectedFile) {
        alert("Please select a file");
        return;
      }
      if ($("#title").val().length === 0) {
        alert("Please add feature Name");
        return;
      }
  
      // Close the modal
      modal.hide();
      let box_id = generateUUID((mode = 0)).toString();
      // Continue with your existing code to add the new box
    
      let dataType=$('input[name="dataType"]:checked').val()
      let temp_box = {
        detectType: detectType,
        x_center: xCenter,
        y_center: yCenter,
        width: Width,
        height: Height,
        box_id: box_id,
        box_name: $("#title").val(),
        box_datatype: dataType,
      };
      addNewBox(temp_box)
      
      
    });
  
  
    $("#closeModalButton").off('click').on("click", function () {
      // Close the modal without adding a new box
      modal.hide();
    });
  }
  
  function handleBoundingBox(element, width, height) {
    // Update the coordinates in image_detail_
    var temp_type = element.data("temp_type");
    var id_ = element.data("box_id");
    var container = $("#file-display");
  
    var containerOffset = container.offset();
    var boxOffset = element.offset();
  
    // Add scroll positions to get the correct coordinates
    var scrollLeft = container.scrollLeft();
    var scrollTop = container.scrollTop();
  
    var relativeX = boxOffset.left - containerOffset.left + scrollLeft;
    var relativeY = boxOffset.top - containerOffset.top + scrollTop;
    var xCenter = (relativeX + width / 2) / imgWidth;
    var yCenter = (relativeY + height / 2) / imgHeight;
    var Width = width / imgWidth;
    var Height = height / imgHeight;
    console.log(xCenter,yCenter);
    console.log(temp_type);
    for (let feature of category[`${temp_type}`]) {
      if (feature.box_id === id_) {
        var xCenter = (relativeX + width / 2) / imgWidth;
        var yCenter = (relativeY + height / 2) / imgHeight;
        var Width = width / imgWidth;
        var Height = height / imgHeight;
  
        feature.x_center = xCenter;
        feature.y_center = yCenter;
        feature.width = Width;
        feature.height = Height;
  
        // Update the element.data
        element.data("x_center", xCenter);
        element.data("y_center", yCenter);
        element.data("width", Width);
        element.data("height", Height);
        break;
      }
    }
  }
  
  function handlerOneClick(boundingBox) {
    $(".bounding-box")
      .not(boundingBox)
      .each(function () {
        // Kiểm tra xem phần tử có plugin resizable đã được khởi tạo hay không
        if ($(this).data("ui-resizable")) {
          $(this).resizable("destroy");
          $(this).draggable("destroy");
        }
      });
  
    if (!boundingBox.data("ui-resizable")) {
      boundingBox
        .resizable({
          containment: $images_file,
          handles: "ne, se, sw, nw",
          minWidth: 10,
          minHeight: 10,
  
          create: function (event, ui) {
            // Thêm màu sắc tùy chỉnh cho handles khi tạo ra
            boundingBox.find(".ui-resizable-handle").css({
              background: `green`,
            });
          },
  
          resize: function (event, ui) {
            handleBoundingBox(
              $(this),
              ui.size.width,
              ui.size.height,
              (mode = "edit")
            );
          },
        })
        .draggable({
          containment: $images_file,
          stop: function (event, ui) {
            handleBoundingBox(
              boundingBox,
              ui.helper.width(),
              ui.helper.height(),
              "edit"
            );
          },
        });
    }
  }
  
  function handlerDoubleClick(boundingBox) {
    var current_class_id = parseInt(boundingBox.data("class_id"));
  
    // Show information in the modal
    $("#current_id").val(current_class_id);
  
    $("#editModal").modal("show");
    // Handle the delete event
    $("#deleteButton")
      .off("click")
      .on("click", function () {
        //  handleBoundingBox(boundingBox, null, null, "delete");
        //  handelAnnotation( null);
        //  autocompleteInput.val("");
        $("#editModal").modal("hide");
      });
  }


  $(document).ready(function(){
    imageSlider();
  });
  
  function imageSlider(){
    var ele, totalCount, eleIndex, eleImgSrc;
    $(document).on('click','.image-item', function(){
      ele=$(this);
      totalCount=ele.closest('.image-list').find('.image-item').length;
      eleIndex=ele.index()+1;
      eleImgSrc=ele.find('img').attr('src');
     $('.image-slider-modal .image-view-list').html('<li><img src="'+eleImgSrc+'" alt="Image"/>');
      for(var i=1; i<=totalCount; i++){
        eleImgSrc = ele.closest('.image-list').find('.image-item:nth-child('+i+') img').attr('src');
        $('.image-slider-modal .thumbnail-list').append('<li><img src="'+eleImgSrc+'" alt="Image"/>');
      }
      $('.image-slider-modal .thumbnail-list li:nth-child('+eleIndex+')').addClass('show');    
      showModal('.image-slider-modal');
      
    });
    
    
    
    $(document).on('click','.slider-handle .btn:not(.disabled)', function(){
      ele=$(this);
      eleIndex=$('.image-slider-modal .thumbnail-list li.show').index()+1;
      totalCount=$('.image-slider-modal .thumbnail-list li').length;
      
      
      if(ele.hasClass('slider-left')){ //Left
        $('.slider-right').removeClass('disabled');
        if(eleIndex==1){
          ele.addClass('disabled');
        }
        else{
          $('.image-slider-modal .thumbnail-list li').removeClass('show');
             $('.image-slider-modal .thumbnail-list li:nth-child('+(eleIndex-1)+')').addClass('show');
          eleImgSrc=$('.image-slider-modal .thumbnail-list li:nth-child('+(eleIndex-1)+') img').attr('src');
          $('.image-slider-modal .image-view-list').html('<li><img src="'+eleImgSrc+'" alt="Image"/>');
        }
      }
      else{ //Right
        $('.slider-left').removeClass('disabled');
        if(eleIndex==totalCount){
          ele.addClass('disabled');
          eleIndex=1;
        }
        else{
          $('.image-slider-modal .thumbnail-list li').removeClass('show');
          $('.image-slider-modal .thumbnail-list li:nth-child('+(eleIndex+1)+')').addClass('show');
          eleImgSrc=$('.image-slider-modal .thumbnail-list li:nth-child('+(eleIndex+1)+') img').attr('src');
          $('.image-slider-modal .image-view-list').html('<li><img src="'+eleImgSrc+'" alt="Image"/>');
        }
      }
    });
  }
  
  function showModal(modal){
    $('.bg-overlay').addClass('show');
    $(modal).addClass('show');
  }
  
  function closeModal(){
      $('.bg-overlay, .modal').removeClass('show');
  }
  
  $(document).ready(function() {
    $("#searchButton").click(function() {
      var filter = $("#searchInput").val().toUpperCase();
      $(".image-list .image-item").each(function() {
        var h5 = $(this).find(".image-details h5");
        var txtValue = h5.data("category_name").toUpperCase();
        
        if (txtValue.indexOf(filter) > -1) {
          $(this).show();
        } else {
          $(this).hide();
        }
      });
    });
  });