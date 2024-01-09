let fileInput = document.getElementById("file-upload-input");
let fileSelect = document.getElementsByClassName("file-upload-select")[0];
let fileDisplay = document.getElementById("file-display");
let imgWidth = null;
let imgHeight = null;
let template_data = { template_id: null,template_name:null, features: [], elements: [] };
let $image_file = $("#images_file");
let originalWidth = null;
let originalHeight = null;

fileSelect.onclick = function () {
  fileInput.click();
};
fileInput.onchange = function () {
  let selectedFile = fileInput.files[0];

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

function addNewBox(temp_type,xCenter, yCenter, width, height, id,name) {
  let $list=null;
  if(temp_type==="features"){
    $list=  $('#flist');
  }
  else{
    $list=  $('#elist');
  }
  // Tạo một đối tượng jQuery mới đại diện cho bounding-box
  var newBox = $(`<div class="bounding-box"></div>`);

  // Thiết lập các thuộc tính của bounding-box
  newBox.data("x_center", xCenter);
  newBox.data("y_center", yCenter);
  newBox.data("width", width);
  newBox.data("height", height);
  newBox.data("id", id);
  newBox.data("type",temp_type);
  $("#bounding-box-container").append(newBox);
  console.log(temp_type);

  template_data[`${temp_type}`].push({
    x_center: xCenter,
    y_center: yCenter,
    width: width,
    height: height,
    id: id,
    name: name
  });
  initBoundingBox(newBox);
  

  $list.prepend(`
  <li class="item">
  <span class="title">Id: ${id}</span>
  <span class="subtitle">Name:${name}</span>
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

function handleBoundingBox(element, width, height) {
  // Update the coordinates in image_detail_
  var temp_type = element.data("type");
  var id_ = element.data("id");
  var container = $("#file-display");
  console.log(element.offset());

  var containerOffset = container.offset();
  var boxOffset = element.offset();

  // Add scroll positions to get the correct coordinates
  var scrollLeft = container.scrollLeft();
  var scrollTop = container.scrollTop();
  console.log("ssssssss",boxOffset.left, boxOffset.top);

  var relativeX = boxOffset.left - containerOffset.left + scrollLeft;
  var relativeY = boxOffset.top - containerOffset.top + scrollTop;
  for (let feature of template_data[`${temp_type}`]) {
    if (feature.id === id_) {
   
      var xCenter = (relativeX + width / 2) / imgWidth;
      var yCenter = (relativeY + height / 2) / imgHeight;
      var Width = width / imgWidth;
      var Height = height / imgHeight;

      feature.x_center = xCenter;
      feature.y_center = yCenter;
      feature.width = Width;
      feature.height = Height;
      console.log(feature);

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

function add_new_box(temp_type="") {
  let selectedFile = fileInput.files[0];
  let name="";
  if (temp_type==='features'){
     name=$("#fname").val();
  }
  else{
    name=$("#ename").val();
  }


  if (!selectedFile) {
    alert("Please select a file");
    return
  }
  if (name.length === 0){
    alert("Please add feature Name");
    return
  }
  let id = generateUUID((mode = 0)).toString();

  let temp_box = {
    x_center: 0.1,
    y_center: 0.1,
    width: 0.1,
    height: 0.1,
  };
  addNewBox(
    temp_type,
    temp_box.x_center,
    temp_box.y_center,
    temp_box.width,
    temp_box.height,
    id,
    name
  );
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

$("#add_temp").on("click", function (e) {
  template_data.template_id = $("#template-id").val();
  template_data.template_name = $("#template-name").val();
  $.ajax({
    url: "/add_template",
    type: "POST",
    contentType: "application/json;charset=utf-8",
    data: JSON.stringify(template_data),
    success: function (response) {
      if (response === "OK") {
        console.log("OK");
      }
    },
    error: function (xhr) {},
  });
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
