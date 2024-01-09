let fileInput = document.getElementById("file-upload-input");
let fileSelect = document.getElementsByClassName("file-upload-select")[0];
let fileDisplay = document.getElementById("file-display");
let imgWidth = null;
let imgHeight = null;


fileSelect.onclick = function() {
	fileInput.click();
}
fileInput.onchange = function() {
    let selectedFile = fileInput.files[0];

    if (selectedFile) {
        let filename = selectedFile.name;
        let selectName = document.getElementsByClassName("file-select-name")[0];
        selectName.innerText = filename;

        if (filename.toLowerCase().endsWith('.pdf')) {
            displayPdf(selectedFile);
        } else if (filename.match(/\.(jpeg|jpg|png|gif)$/)) {
            displayImage(selectedFile);
        } else {
            console.log("Unsupported file type");
        }
    }
}

function displayPdf(file) {
    // Handle PDF file display here (e.g., using a PDF viewer library)
    fileDisplay.innerHTML = '<iframe src="' + URL.createObjectURL(file) + '" width="100%" height="800px"></iframe>';
}

function displayImage(file) {
    let reader = new FileReader();
    reader.onload = function (e) {
        let imageElement = new Image();
        imageElement.src = e.target.result;
    
        imageElement.onload = function () {
        //   originalWidth = imageElement.naturalWidth;
        //   originalHeight = imageElement.naturalHeight;
    
          $("#images_file").attr("src", e.target.result);
          imgWidth =  $("#images_file").width();
          imgHeight = $("#images_file").height();
          console.log(imgWidth, imgHeight);
        };
    };
    reader.readAsDataURL(file);
}


function uploadAndOCR() {
    let selectedFile = fileInput.files[0];

    if (selectedFile) {
        var formData = new FormData();
        formData.append('file', selectedFile);

        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/upload', true);

        xhr.onload = function () {
            if (xhr.status === 200) {
                var response = JSON.parse(xhr.responseText);
                if (response.success) {
                    let htmlContent=`<div class="row m-0 p-0">
                    <div class="col-4">EasyOCR</div>
                    <div class="col-4">Tesseract</div>
                    </div>`;
                    for (var rs of response.ocr_result) {{
                            htmlContent += `<div class="row m-0 p-0">
             
                            <div class="col-4">
                                <div class="input-container">
                                  <label class="label">${rs.boxes.name}</label>
                                  <input class="input" value="${rs.easyocr_result}" />
                                </div>
                              </div>
                              <div class="col-4">
                              <div class="input-container">
                                <label class="label">${rs.boxes.name}</label>
                                <input class="input" value="${rs.tesseract_result}" />
                              </div>
                            </div>
                              <div class="w-100"></div>`;
                        }

                          // Tạo một đối tượng jQuery mới đại diện cho bounding-box
                            var newBox = $(
                                `<div class="bounding-box-view"></div>`
                            );

                            // Thiết lập các thuộc tính của bounding-box
                            newBox.data("x_center", rs.boxes.x_center);
                            newBox.data("y_center", rs.boxes.y_center);
                            newBox.data("width", rs.boxes.width);
                            newBox.data("height", rs.boxes.height);
                            newBox.data("id", rs.boxes.id);
                            $("#bounding-box-container").append(newBox);
                            initBoundingBox(newBox);
                                                }
                    
                    // Update the HTML content of '#ocr_result'
                    $('#ocr_result').html(htmlContent);
                } else {
                  console.log('Failed to upload');
                }
            }
        };

        xhr.send(formData);
    } else {
        alert('Please choose a file before uploading.');
    }
}



function initBoundingBox(boundingBox) {
    var xCenter = parseFloat(boundingBox.data("x_center"));
    var yCenter = parseFloat(boundingBox.data("y_center"));
    var width = parseFloat(boundingBox.data("width"));
    var height = parseFloat(boundingBox.data("height"));
    console.log(imgHeight ,imgWidth );
  
    boundingBox.css({
      left: xCenter * imgWidth - (width * imgWidth) / 2 + "px",
      top: yCenter * imgHeight - (height * imgHeight) / 2 + "px",
      width: width * imgWidth + "px",
      height: height * imgHeight + "px",
    });
  

  }
  