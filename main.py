from flask import (
    Flask,
    render_template,
    redirect,
    url_for,
    request,
    send_file,
    jsonify,
    send_from_directory,
    session,
    make_response
)
from flask_sslify import SSLify

import io,os
from PIL import Image
import numpy as np
import json,base64

from pymongo import MongoClient, ReturnDocument

from jinja2 import Template

# from paddleocr import PaddleOCR,draw_ocr
import pytesseract,cv2,easyocr

from ultralytics import YOLO


pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe' 

# ocr = PaddleOCR(use_angle_cls=True, lang="japan")

app = Flask(__name__, static_url_path="/static")
RESOURCE_FOLDER = './static/resources' 
app.config['RESOURCE_FOLDER'] = RESOURCE_FOLDER
sslify = SSLify(app)
app.secret_key = "upc_suwa"

reader_ja = easyocr.Reader(lang_list=["ja"])
reader_en = easyocr.Reader(lang_list=["en"])
reader_ja_en = easyocr.Reader(lang_list=["ja","en"])
model=YOLO('model/best.pt')

client = MongoClient("mongodb://localhost:27017/")
db = client["ai_ocr"]
categories_doc=db["categories"]


import pathlib

@app.route('/test')
def test():
    path = request.args.get('path', 'D:/Requirement/predict/')
    abs_path = os.path.join(path)

    if os.path.isfile(abs_path):
        os.startfile(abs_path)
        return 'File opened'

    files = os.listdir(abs_path)
    files = [{'name': f, 'path': os.path.join(path, f)} for f in files]
    return render_template('test.html', files=files, path=path)


@app.route("/")
@app.route('/login',methods=['POST','GET'])
def login():
    if request.method == 'GET':
        return render_template("main/login.html")
    
@app.route('/index',methods=['POST','GET'])
def index():
    if request.method == 'GET':
        return render_template("main/index.html")

@app.route('/template_list',methods=['POST','GET'])
def template_list():
    if request.method == 'GET':
        try:
            cursor=categories_doc.find()
            categories=list(cursor)
        except FileNotFoundError:
            categories = []
        
        return render_template("main/template_list.html",categories=categories)
 
@app.route('/template_detail',methods=['POST','GET'])
def template_detail():
    if request.method == 'GET':
        category_id=request.args.get('category_id')
        category=categories_doc.find_one({'category_id':category_id})
        if category:
            return render_template("main/template_detail.html", category=category)
        else:
            return render_template("main/404.html")
        
import fitz       
from pathlib import Path 
import shutil     
import csv
import subprocess
@app.route('/predict',methods=['POST','GET'])
def predict():
    sources_path="D:\Requirement\PDF"
    predict_path = "D:\Requirement\predict"
    #shutil.rmtree(predict_path)
    
    if request.method == 'GET':
        os.makedirs(sources_path, exist_ok=True)
        os.makedirs(predict_path, exist_ok=True)
        
        return render_template("main/predict.html",sources_path=sources_path,predict_path=predict_path)
    if request.method == 'POST':
        folder_path=Path(sources_path)
        pdf_files = folder_path.rglob("*.pdf")
        cursor=categories_doc.find()
        categories=list(cursor)
        categories_id=[category["category_id"] for category in categories]

        for pdf_file in pdf_files:
            pdf_document = fitz.open(pdf_file)
            category=None
            category_path=None
            for page_number in range(len(pdf_document)):
                # Get each page
                page = pdf_document.load_page(page_number)
                
                # Convert the page to a PIL image
                pix = page.get_pixmap()
                image = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
              
              
                if category is None:
                    rs=model.predict(image)
                    names = model.names
                    conf=rs[0].probs.top1conf.item()
                    category=names[rs[0].probs.top1]
                    category_path=os.path.join(predict_path,f"error") if conf <0.7 else os.path.join(predict_path,f"{category}")
                
                os.makedirs(category_path, exist_ok=True)
                shutil.copy(pdf_file, os.path.join(category_path,pdf_file.name))
                if category in categories_id:
                    ocr_result = perform_ocr(image, category)
                
                # # image.save(f"{pdf_file}_page_{page_number}.jpg")
                    if category_path:
                        csv_file_path = os.path.join(category_path, f"{category}.csv")
                        with open(csv_file_path, 'a+', newline='',encoding="utf-8-sig") as file:
                            writer = csv.writer(file)
                            writer.writerow([page_number, ocr_result])
                    
                
                    os.makedirs(category_path, exist_ok=True)
                    shutil.copy(pdf_file, os.path.join(category_path,pdf_file.name))
                
            pdf_document.close()
        
      
       # open_file_explorer(predict_path)
         
        return  jsonify({'status': "success"})
 
@app.route('/open_folder',methods=['POST','GET'])
def open_folder():
     data=request.get_json()
     predict_path=data['predict_path']
     open_file_explorer(predict_path)
     return  jsonify({'status': "success"})
       
def open_file_explorer(path):
    if os.path.exists(path):
        if os.name == 'nt':  # For Windows
            subprocess.Popen(['explorer', path], shell=True)
    else:
        print("The specified path does not exist.")
     
@app.route('/add_template',methods=['POST','GET'])
def add_template():
    if request.method == 'GET':
        return render_template("main/add_template.html")
    if request.method == 'POST':
        file = request.files['file']
        data= request.form.get('data')
        file_data = base64.b64encode(file.read()).decode('utf-8')
        data_dict = json.loads(data)
        
        data_dict['file_base64'] = file_data
        data= request.form.get('data')
        print(categories_doc)
        categories_doc.insert_one(data_dict)
        return  jsonify({'status': "success"})
    
    
@app.route('/upload', methods=['POST'])
def upload_and_ocr():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'})
    file = request.files['file']
  
    if file.filename == '':
        return jsonify({'error': 'No selected file'})

    if file:
        file_contents = file.read()
        # image = Image.open(io.BytesIO(file_contents))
        # image=np.array(image)
        # cv2.imwrite('orc.png', image)
        
        # result=ocr_space_file(filename='orc.png')
        # with open('ocr_result.json', 'w') as json_file:
        #     json.dump(result, json_file, indent=2)

        image = Image.open(io.BytesIO(file_contents))
        rs=model.predict(image)
        names = model.names
        conf=rs[0].probs.top1conf.item()
        category=names[rs[0].probs.top1]
        print(category)
        if conf <=0.5:
            return jsonify({'status': "failed"})
      
        ocr_result = perform_ocr(image,category)
        if len(ocr_result['data'])>0:
            return jsonify({'status': "success", 'ocr_result': ocr_result})
        else:
            return jsonify({'status': "failed"})

    return jsonify({'error': 'Unknown error'})

import requests
def ocr_space_file(filename, overlay=False, api_key='K87026219188957', language='jpn'):
    """ OCR.space API request with local file.
        Python3.5 - not tested on 2.7
    :param filename: Your file path & name.
    :param overlay: Is OCR.space overlay required in your response.
                    Defaults to False.
    :param api_key: OCR.space API key.
                    Defaults to 'helloworld'.
    :param language: Language code to be used in OCR.
                    List of available language codes can be found on https://ocr.space/OCRAPI
                    Defaults to 'en'.
    :return: Result in JSON format.
    """

    payload = {'isOverlayRequired': overlay,
               'apikey': api_key,
               'language': language,
               }
    with open(filename, 'rb') as f:
        r = requests.post('https://api.ocr.space/parse/image',
                          files={filename: f},
                          data=payload,
                          )
    return r.content.decode()

def perform_ocr(image,category):
    try:
        cursor=categories_doc.find({},{"_id":0})
        categories=list(cursor)
        result_entry ={"headers":[],"data":[],"boxes":[]}
        for template in categories:
            if template['category_id']==category:
                for box in template['ocr_detects']:
                    result_entry['headers'].append(box['box_name'])
                    
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
                    save_path = './static/resources'
                    cropped_image = image.crop(box_coordinates)
                    processed_img = np.array(cropped_image)
                    gray_image = cv2.cvtColor(processed_img, cv2.COLOR_BGR2GRAY)
                    processed_img=gray_image
                    min_size = 8
                    contrast_ths = 0.8
                    adjust_contrast = 0.8
                    text_threshold = 0.5
                    processed_img_save_path = os.path.join(save_path, f"{box['box_id']}.png")
                    cv2.imwrite(processed_img_save_path, processed_img)
                    if box['box_datatype'] == 'ocr':
                        result_en = reader_en.readtext(processed_img,min_size=min_size, 
                                                                    contrast_ths=contrast_ths, 
                                                                    adjust_contrast=adjust_contrast, 
                                                                    text_threshold=text_threshold)
                        result_ja = reader_ja.readtext(processed_img,min_size=min_size, 
                                                                    contrast_ths=contrast_ths, 
                                                                    adjust_contrast=adjust_contrast, 
                                                                    text_threshold=text_threshold)
                        result_ja_en = reader_ja_en.readtext(processed_img,min_size=min_size, 
                                                                    contrast_ths=contrast_ths, 
                                                                    adjust_contrast=adjust_contrast, 
                                                                    text_threshold=text_threshold)
                     
                     
                        min_len = min(len(result_en), len(result_ja),len(result_ja_en))
                        for i in range(min_len):
                            detection_en = result_en[i]
                            detection_ja = result_ja[i]
                            detection_ja_en = result_ja_en[i]
                            
                            max_confidence = max(detection_en[2], detection_ja[2])
                            
                            if max_confidence == detection_en[2]:
                                result_en[i] = detection_en
                            elif max_confidence == detection_ja[2]:
                                result_en[i] = detection_ja
                            else:
                                result_en[i] = detection_ja_en
                        # grouped_rectangles = group_rectangles(result_en)
                        # group_data=[]
                        # for group in grouped_rectangles:
                            
                        #     row_strings = [rectangle[1] for rectangle in group]
                        #     combined_row_string = ' '.join(row_strings)
                        #     group_data.append(combined_row_string)
                        #     print(group_data)
                        row_strings = [item[1] for item in result_en]
                        result_entry['data'].append(row_strings)     
                    if box['box_datatype'] == 'tesseract':
                        # text = pytesseract.image_to_data(processed_img, lang='jpn+eng',config=custom_config,output_type="data.frame")
                        # text = text[text.conf != -1]
                        # lines = text.groupby(['page_num', 'block_num', 'par_num', 'line_num'])['text'] \
                        #              .apply(lambda x: ' '.join(list(x))).tolist()
                        # confs = text.groupby(['page_num', 'block_num', 'par_num', 'line_num'])['conf'].mean().tolist()
                        # Process the image and extract text with additional configuration
                        custom_config = r'--oem 3 --psm 6'
                        text = pytesseract.image_to_string(processed_img, lang='jpn+eng',config=custom_config)
                        lines = text.split('\n')
                        lines = list(filter(None, lines))
                        print(lines)
                        result_entry['data'].append(lines)
                    result_entry["boxes"].append(box);
        return result_entry
    except Exception as e:
        raise e

def group_rectangles(rectangles, threshold=10):
    grouped_rectangles = []
    current_group = [rectangles[0]]

    for i in range(1, len(rectangles)):
        prev_rect = rectangles[i-1]
        current_rect = rectangles[i]

        if current_rect[0][0][1] - prev_rect[0][0][1] <= threshold:
            current_group.append(current_rect)
        else:
            grouped_rectangles.append(current_group)
            current_group = [current_rect]

    grouped_rectangles.append(current_group)

    return grouped_rectangles


@app.route('/get_categories', methods=['GET'])
def get_category_ids():
    cursor=categories_doc.find({},{"_id":0})
    categories=list(cursor)
    print
    return jsonify(categories)

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
    app.run(debug=True, port=80)