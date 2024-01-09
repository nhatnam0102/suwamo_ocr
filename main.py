from flask import (
    Flask,
    render_template,
    redirect,
    url_for,
    request,
    send_file,
    jsonify,
    session,
    make_response
)
from flask_sslify import SSLify

import io,os
from PIL import Image
import numpy as np
import json

from jinja2 import Template

# from paddleocr import PaddleOCR,draw_ocr
import pytesseract,cv2,easyocr


pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe' 

# ocr = PaddleOCR(use_angle_cls=True, lang="japan")

app = Flask(__name__, static_url_path="/static")
sslify = SSLify(app)
app.secret_key = "upc_suwa"

reader = easyocr.Reader(lang_list=['en'])



@app.route("/")
@app.route('/index',methods=['POST','GET'])
def index():
    if request.method == 'GET':
        return render_template("main/index.html")

@app.route('/add_template',methods=['POST','GET'])
def add_template():
    if request.method == 'GET':
        return render_template("main/add_template.html")
    if request.method == 'POST':
        file_path='./static/resource/template.json'
        
        data=request.get_json()
        try:
            with open(file_path, 'r',encoding='utf-8') as json_file:
                existing_list = json.load(json_file)
        except FileNotFoundError:
            existing_list = []
        existing_list.append(data)
        with open(file_path, 'w',encoding='utf-8') as json_file:
            json.dump(existing_list, json_file)
        return "OK"
    
    
@app.route('/upload', methods=['POST'])
def upload_and_ocr():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'})
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'})

    if file:
        file_contents = file.read()

        ocr_result = perform_ocr(file_contents)
        return jsonify({'success': True, 'ocr_result': ocr_result})

    return jsonify({'error': 'Unknown error'})


def perform_ocr(file_contents):
    try:
        image = Image.open(io.BytesIO(file_contents))
        
        ocr_results = []
        
        file_path='./static/resource/template.json'
        
        with open(file_path, 'r',encoding='utf-8') as json_file:
            existing_list = json.load(json_file)
            
        for template in existing_list:
            for box in template['elements']:
                x_center = int(box['x_center'] * image.width)
                y_center = int(box['y_center'] * image.height)
                width = int(box['width'] * image.width)
                height = int(box['height'] * image.height)

                box_coordinates = (
                    x_center - width // 2,
                    y_center - height // 2,
                    x_center + width // 2,
                    y_center + height // 2
                )
                save_path = './static/resource'
                cropped_image = image.crop(box_coordinates)
                # save_filename = f"{box['id']}_cropped.png"
                # save_filepath = os.path.join(save_path, save_filename)
                # cropped_image.save(save_filepath)
                
                cropped_array = np.array(cropped_image)

                # # Xử lý ảnh trước khi sử dụng pytesseract
                processed_img = cv2.cvtColor(cropped_array, cv2.COLOR_BGR2GRAY)
                
                # Áp dụng Gaussian Blur để làm mờ ảnh
                processed_img = cv2.GaussianBlur(processed_img, (11,11), 0)

                # Áp dụng phép nhị phân hóa
                _, processed_img = cv2.threshold(processed_img, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

                # )
                processed_img_save_path = os.path.join(save_path, f"{box['id']}.png")
                cv2.imwrite(processed_img_save_path, processed_img)

                result = reader.readtext(processed_img,allowlist="0123456789.")
                text = pytesseract.image_to_string(processed_img,lang="eng")
                # result_ = ocr.ocr(processed_img, cls=False)
                # sorted_rows = sort_boxes_by_row(result_[0])                 
                # html_table = create_html_table(sorted_rows)
                
                # for idx in range(len(result_)):
                #     res = result_[idx]
                #     print(res)
                
              
                ocr_results.append({
                    "boxes":box if box else {},
                    'easyocr_result': result[0][1] if result else '',
                    "tesseract_result": text if text else "",
                    "paddle_result":text,
                })
        return ocr_results
    except Exception as e:
        raise e
    
def sort_boxes_by_row(boxes):
    # Sắp xếp các bounding box theo tọa độ y của top_left
    sorted_boxes = sorted(boxes, key=lambda box: box[0][0][1])

    rows = []
    current_row = [sorted_boxes[0]]

    # Phân loại các bounding box vào các hàng dựa trên tọa độ y
    for i in range(1, len(sorted_boxes)):
        current_box = sorted_boxes[i]
        previous_box = current_row[-1]

        if current_box[0][0][1] - previous_box[0][0][1] < 10:  # Assume a threshold of 50 pixels for same row
            current_row.append(current_box)
        else:
            rows.append(current_row)
            current_row = [current_box]

    rows.append(current_row)

    # Sắp xếp mỗi hàng dựa trên tọa độ x của top_left
    for i in range(len(rows)):
        rows[i] = sorted(rows[i], key=lambda box: box[0][0][0])

    return rows


def create_html_table(rows):
    template_str = """
    <table border='1'>
        {% for row in rows %}
            <tr>
                {% for box in row %}
                    <td style="white-space: nowrap;">{{ box[1][0] }}</td>
                {% endfor %}
            </tr>
        {% endfor %}
    </table>
    """
    template = Template(template_str)
    html_table = template.render(rows=rows)

    return html_table

if __name__ == "__main__":
    app.run(host="192.168.11.45", port=5000, debug=True)