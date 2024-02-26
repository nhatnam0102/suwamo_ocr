let fileInput = document.getElementById("file-upload-input");
let fileSelect = document.getElementsByClassName("file-upload-select")[0];
let fileDisplay = document.getElementById("file-display");
let imgWidth = null;
let imgHeight = null;
let template_data = {
  category_id: null,
  category_name: null,
 　yolo_features: [],
  ocr_detects: [],
};
let $image_file = $("#images_file");
let originalWidth = null;
let originalHeight = null;
let selectedFile=null;

fileSelect.onclick = function () {
  fileInput.click();
};
fileInput.onchange = function () {
  selectedFile = fileInput.files[0];

  if (selectedFile) {
    let filename = selectedFile.name;
    let selectName = document.getElementsByClassName("file-select-name")[0];
    selectName.innerText = filename;

    if (filename.toLowerCase().endsWith(".pdf")) {
      displayPdf(selectedFile);
    } else if (filename.match(/\.(jpeg|jpg|png|gif)$/)) {
      displayImage(selectedFile);
    } else {
      console.log("Unsupported file type");
    }
  }
};

function displayPdf(file) {
  // Handle PDF file display here (e.g., using a PDF viewer library)
  fileDisplay.innerHTML =
    '<iframe src="' +
    URL.createObjectURL(file) +
    '" width="100%" height="800px"></iframe>';
}

function displayImage(file) {
  let reader = new FileReader();
  reader.onload = function (e) {
    let imageElement = new Image();
    imageElement.src = e.target.result;

    imageElement.onload = function () {
      originalWidth = imageElement.naturalWidth;
      originalHeight = imageElement.naturalHeight;

      //     console.log("Width: " + imgWidth);
      //     console.log("Height: " + imgHeight);
      $("#images_file").attr("src", e.target.result);
      imgWidth = $image_file.width();
      imgHeight = $image_file.height();
      console.log(imgWidth, imgHeight);
    };
  };
  reader.readAsDataURL(file);
}

function addNewBox(temp_box) {
  let $list = null;
  if (temp_box.detectType === "yolo_features") {
    $list = $("#flist");
  } else {
    $list = $("#elist");
  }
  // Tạo một đối tượng jQuery mới đại diện cho bounding-box
  var newBox = $(`<div class="bounding-box"></div>`);

  // Thiết lập các thuộc tính của bounding-box
  newBox.data("x_center", temp_box.x_center);
  newBox.data("y_center", temp_box.y_center);
  newBox.data("width", temp_box.width);
  newBox.data("height", temp_box.height);
  newBox.data("box_id", temp_box.box_id);
  newBox.data("detectType", temp_box.detectType);
  $("#bounding-box-container").append(newBox);

  template_data[`${temp_box.detectType}`].push(temp_box);
  initBoundingBox(newBox);

  $list.prepend(`
  <li class="item">
  <span class="title">項目名001:${ temp_box.box_name}</span>
  <span class="subtitle">項目ID001: ${ temp_box.box_id}</span>
</li>`);
  console.log(template_data);
}

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
  var temp_type = element.data("detectType");
  var id_ = element.data("box_id");
  var container = $("#file-display");

  var containerOffset = container.offset();
  var boxOffset = element.offset();

  // Add scroll positions to get the correct coordinates
  var scrollLeft = container.scrollLeft();
  var scrollTop = container.scrollTop();

  var relativeX = boxOffset.left - containerOffset.left + scrollLeft;
  var relativeY = boxOffset.top - containerOffset.top + scrollTop;
  for (let feature of template_data[`${temp_type}`]) {
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
        containment: $image_file,
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
        containment: $image_file,
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

function crop() {
  var canvas = document.createElement("canvas");

  // Assuming template_data.features[0] contains centerX, centerY, width, and height in the range [0, 1]
  var centerX = template_data.features[0].x_center;
  var centerY = template_data.features[0].y_center;
  var width = template_data.features[0].width;
  var height = template_data.features[0].height;

  // Calculate absolute coordinates based on YOLOv5 format
  var absoluteLeft = (centerX - width / 2) * originalWidth;
  var absoluteTop = (centerY - height / 2) * originalHeight;
  var absoluteWidth = width * originalWidth;
  var absoluteHeight = height * originalHeight;
  console.log(
    absoluteLeft,
    absoluteLeft,
    absoluteWidth,
    absoluteHeight,
    originalWidth,
    originalHeight
  );

  canvas.width = absoluteWidth;
  canvas.height = absoluteHeight;
  var context = canvas.getContext("2d");

  // Ensure that the image has loaded before attempting to draw it
  var im = document.getElementById("images_file");
  if (im.complete) {
    context.drawImage(
      im,
      absoluteLeft,
      absoluteTop,
      absoluteWidth,
      absoluteHeight,
      0,
      0,
      absoluteWidth,
      absoluteHeight
    );

    // Convert the canvas content to data URL
    var croppedDataURL = canvas.toDataURL("image/png");
    console.log(croppedDataURL);
    $("#images_file_1").attr("src", croppedDataURL);
  } else {
    // If the image is not yet loaded, wait for the 'load' event
    im.onload = function () {
      context.drawImage(
        im,
        absoluteLeft,
        absoluteTop,
        absoluteWidth,
        absoluteHeight,
        0,
        0,
        absoluteWidth,
        absoluteHeight
      );

      // Convert the canvas content to data URL
      var croppedDataURL = canvas.toDataURL("image/png");
      console.log(croppedDataURL);
      $("#images_file_1").attr("src", croppedDataURL);
    };
  }
}

function hideAllSections1(...elements) {


  elements.forEach((element) => {
    if (element !== undefined|| element !=null) {
      element.removeClass("d-none").addClass("d-none");;
    }
  });
}

$("#btnShowModalConfirm").off("click").on("click", function (e) {

  hideAllSections1(
    $(".confirm__del-box"),
    $(".confirm__del-image"),
    $(".confirm__del-ok"),
    $(".confirm__del-ng")
  );
  $(".confirm__del-image").removeClass("d-none");

  $("#confirm").modal("show");

  
});

function generateUUID(mode = null) {
  var now = new Date();
  var timestamp = now.getTime().toString(16);
  let format_ = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
  if (mode === 0) {
    format_ = "xxxx-4xxx-yxxx";
  }
  var uuid = format_.replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0;
    var v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

  uuid = uuid.replace("y", timestamp.substr(0, 8));
  return uuid;
}

let uuid = generateUUID((mode = null));
$("#template-id").val(uuid);
if ($('input[name="detectType"]:checked').val() === 'yolo_features') {
  $('#dataTypeContainer').addClass('hidden');
}

$('input[name="detectType"]').change(function() {
  if ($(this).val() === 'yolo_features') {
    $('#dataTypeContainer').addClass('hidden');
  } else {
    $('#dataTypeContainer').removeClass('hidden');
  }
});


// Event handler for the delete image button click
$("#btnAddTemp").on("click", function (e) {
  // AJAX request to delete the image
  template_data.category_id = $("#category_id").val();
  template_data.category_name = $("#category_name").val();

      var formData = new FormData();
      var template_data_string = JSON.stringify(template_data);
      formData.append('file', selectedFile);
      formData.append('data', template_data_string);

      var xhr = new XMLHttpRequest();
      xhr.open('POST', '/add_template', true);

      xhr.onload = function () {
        if (xhr.status === 200) {
          hideAllSections1(
            $(".confirm__del-image"),
            $(".confirm__del-box"),
            $(".confirm__del-ok"),
            $(".confirm__del-ng")
          );
          $(".confirm__del-ok").removeClass("d-none");
  
          // Reload the page after a delay
          setTimeout(function () {
            window.location.reload();
          }, 2000);
        } else {
          hideAllSections1(
            $(".confirm__del-image"),
            $(".confirm__del-box"),
            $(".confirm__del-ok"),
            $(".confirm__del-ng")
          );
          $(".confirm__del-ng").removeClass("d-none");
        }
      };

      xhr.send(formData);

});

