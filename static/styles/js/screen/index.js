let fileInput = document.getElementById("file-upload-input");
let fileSelect = document.getElementsByClassName("file-upload-select")[0];
let fileDisplay = document.getElementById("file-display");
let imgWidth = null;
let imgHeight = null;


fileSelect.onclick = function() {
	fileInput.click();
}
fileInput.onchange = function() {
    $("#bounding-box-container").html("");
    $('.table-container').removeClass('d-none').addClass('d-none');
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


let response_results;
function uploadAndOCR() {
    
    $('.loader').removeClass('d-none');
    $('.table-container').removeClass('d-none').addClass('d-none');
    let selectedFile = fileInput.files[0];
    if (selectedFile) {
        var formData = new FormData();
        formData.append('file', selectedFile);
        // formData.append('selectedCategory',selectedCategory);

        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/upload', true);

        xhr.onload = function () {
            if (xhr.status === 200) {
                $('.loader').removeClass('d-none').addClass('d-none');
                $('.table-container').removeClass('d-none');
                var response = JSON.parse(xhr.responseText);
                if (response.status==="success") {
                const tableHead = $('#data-table thead');
                const headerRow = $('<tr class="header-row"></tr>');
                response_results=response.ocr_result;
               
                response.ocr_result['headers'].forEach(function(header) {
                    headerRow.append(`<th>${header}</th>`);
                });
                tableHead.html(headerRow);

                const tableBody = $('#data-body');
                const rowData =response.ocr_result['data'].map(item => {
                  const listItems = [];
                  for (let key of item) {
                    listItems.push(`<li>${key}
                  </li>`);
                  }
                //   <button class="cssbuttons-io">
                //     <span>
                //       候補</span>
                //   </button>
              
                  let htmlString = `<td>${listItems.join('')}</td>`;

                  return htmlString;
                });
                const row = `<tr>${rowData.join('\n')}</tr>`;
                tableBody.html(row);
                $("#bounding-box-container").html("");
                for (let box of response.ocr_result['boxes'] ){
                  var newBox = $(
                    `<div class="bounding-box-view"></div>`
                ); 
                      newBox.data("x_center", box.x_center);
                      newBox.data("y_center",  box.y_center);
                      newBox.data("width", box.width);
                      newBox.data("height", box.height);
                      newBox.data("box_id", box.box_id);
                      $("#bounding-box-container").append(newBox);
                      initBoundingBox(newBox);
                }                   
            
                } else {
                    $('.loader').removeClass('d-none').addClass('d-none');
                        alert("認識できませんでした。");
                       
                }
            }
        };

        xhr.send(formData);
    } else {
        alert('Please choose a file before uploading.');
        $('.loader').removeClass('d-none').addClass('d-none');
    }
}


function exportDataToCSV(filename) {
    var csv = [];
    var headers =response_results.headers;
    var data =response_results.data;
    csv.push(`"${headers.join('","')}"`);
    var row = [];
    for(let list_text of data) {
      row.push(`"${list_text.join(",")}"`);
    }
    csv.push(row.join(","));
    var csvFile = new Blob(["\uFEFF" + csv.join("\n")], { type: "text/csv;charset=utf-8;" });
    var downloadLink = document.createElement("a");
    downloadLink.download = filename;
    downloadLink.href = window.URL.createObjectURL(csvFile);
    downloadLink.style.display = "none";

    document.body.appendChild(downloadLink);
    downloadLink.click();
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


// const selectWrapper = document.querySelector('.select-wrapper');
// const selectBtn = selectWrapper.querySelector('.select-btn');
// const searchInput = selectWrapper.querySelector('input');
// const optionsBox = selectWrapper.querySelector('.options');

// searchInput.setAttribute("placeholder", "Search");

// // Function to fetch categories from Flask server
// async function fetchCategories() {
//     try {
//         const response = await fetch('/get_categories'); // Replace with the actual endpoint on your Flask server
//         const data = await response.json();
//         return data;
//     } catch (error) {
//         console.error('Error fetching categories:', error);
//         return [];
//     }
// }

// // Function to add categories to the optionsBox
// async function addCategory(selectedCategory) {
//     optionsBox.innerHTML = "";

//     // Fetch categories from Flask server
//     const categories = await fetchCategories();

//     for (let category of categories) {
//         let isSelected = category.category_id == selectedCategory ? "class='selected'" : "";
//         optionsBox.insertAdjacentHTML("beforeend", `
//             <li onclick="updateName(this)" ${isSelected} data-category_id="${category.category_id}">${ category.category_name}</li>
//         `);
//     }
// }

// // Call addCategory to initially load categories
// addCategory();
// let selectedCategory=null;

// function updateName(selectedLi) {
//     searchInput.value = "";
//     addCategory($(selectedLi).data('category_id'));
//     selectWrapper.classList.remove('active');
//     selectBtn.firstElementChild.textContent = selectedLi.textContent;
//     selectedCategory=$(selectedLi).data('category_id');
//     console.log(selectedCategory);

// }

// searchInput.addEventListener("keyup", () => {
//     let arrSearch = [];
//     let searchedCategory = searchInput.value.toLowerCase();
    
//     arrSearch = categories.filter(data => {
//         return data.toLowerCase().startsWith(searchedCategory);
//     }).map((data) => `<li onclick="updateName(this)">${data}</li>`).join("");
//     optionsBox.innerHTML = arrSearch ? arrSearch : `<p>分類が見つかりません。</p>`;
// });

// selectBtn.addEventListener("click", () => {
//     selectWrapper.classList.toggle('active');
// });
  
// document.addEventListener("click", (event) => {
//     const isInsideSelectWrapper = selectWrapper.contains(event.target);
//     if (!isInsideSelectWrapper && selectWrapper.classList.contains('active')) {
//         selectWrapper.classList.remove('active');
//     }
// });