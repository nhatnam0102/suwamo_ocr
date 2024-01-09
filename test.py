

# import sys
# from PyQt5.QtWidgets import QApplication, QMainWindow, QLabel, QVBoxLayout, QWidget, QPushButton, QFileDialog, QProgressBar
# from PyQt5.QtGui import QPixmap, QImage, QPainter, QBrush, QColor,QPainterPath
# from PyQt5.QtCore import QTimer
# import cv2
# import numpy as np
# from PIL import Image, ImageDraw, ImageFont
# import easyocr

# class RoundedLabel(QLabel):
#     def __init__(self, parent=None):
#         super(RoundedLabel, self).__init__(parent)
#         self.setScaledContents(True)

#     def paintEvent(self, event):
#         painter = QPainter(self)
#         painter.setRenderHint(QPainter.Antialiasing, True)
#         painter.setRenderHint(QPainter.SmoothPixmapTransform, True)

#         path = QPainterPath()
#         path.addRoundedRect(0, 0, self.width(), self.height(), 10, 10)
#         painter.setClipPath(path)
#         painter.setClipRect(0, 0, self.width(), self.height())
#         super(RoundedLabel, self).paintEvent(event)

# class OCRApp(QMainWindow):
#     def __init__(self):
#         super().__init__()
#         self.reader_en = easyocr.Reader(['en'])
#         self.reader_ja = easyocr.Reader(['ja'])
#         self.initUI()

#     def initUI(self):
#         self.setWindowTitle('OCR App')
#         self.setGeometry(100, 100, 800, 600)

#         self.central_widget = QWidget(self)
#         self.setCentralWidget(self.central_widget)

#         self.layout = QVBoxLayout()

#         self.label = RoundedLabel(self)  # Use RoundedLabel instead of QLabel
#         self.layout.addWidget(self.label)

#         self.btn_open_file = QPushButton('Open Image', self)
#         self.btn_open_file.clicked.connect(self.openImage)
#         self.layout.addWidget(self.btn_open_file)

#         self.progress_bar = QProgressBar(self)
#         self.layout.addWidget(self.progress_bar)

#         self.central_widget.setLayout(self.layout)

#         self.timer = QTimer(self)
#         self.timer.timeout.connect(self.updateProgressBar)

#     def openImage(self):
#         options = QFileDialog.Options()
#         options |= QFileDialog.ReadOnly
#         filePath, _ = QFileDialog.getOpenFileName(self, 'Open Image', '', 'Image Files (*.png *.jpg *.jpeg)', options=options)

#         if filePath:
#             self.processImage(filePath)

#     def processImage(self, filePath):
#         self.progress_bar.setValue(0)
#         self.progress_bar.show()

#         # Simulate loading with a timer
#         self.timer_count = 0
#         self.image_path = filePath
#         self.timer.start(50)  # Adjust the timer interval as needed

#     def updateProgressBar(self):
#         if self.timer_count <= 100:
#             self.timer_count += 1
#             self.progress_bar.setValue(self.timer_count)

#             if self.timer_count == 100:
#                 self.timer.stop()
#                 self.displayImage()

#     def displayImage(self):
#         image = cv2.imread(self.image_path)

#         # Sử dụng EasyOCR để đọc văn bản
#         result_en = self.reader_en.readtext(image)
#         result_ja = self.reader_ja.readtext(image)

#         # Kết hợp kết quả từ các ngôn ngữ
#         all_results = result_en + result_ja

#         # Chuyển đổi từ BGR sang RGB để sử dụng với Pillow
#         image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
#         image_pil = Image.fromarray(image_rgb)

#         # Tạo đối tượng ImageDraw để vẽ lên hình ảnh
#         draw = ImageDraw.Draw(image_pil)

#         # Sử dụng font của Pillow
#         font_path = "C:\\Windows\\Fonts\\simsun.ttc"
#         font_size = 15  # Đặt kích thước font theo mong muốn
#         font = ImageFont.truetype(font_path, font_size)

#         # Hiển thị hình ảnh với đường viền và văn bản
#         for detection in all_results:
#             # Lấy tọa độ của hình chữ nhật
#             points = detection[0]
#             (tl, tr, br, bl) = points
#             tl = (int(tl[0]), int(tl[1]))
#             tr = (int(tr[0]), int(tr[1]))
#             br = (int(br[0]), int(br[1]))
#             bl = (int(bl[0]), int(bl[1]))

#             # Vẽ đường viền hình chữ nhật lên hình ảnh
#             draw.polygon([tl, tr, br, bl], outline=(0, 255, 0), width=2)

#             # Lấy vị trí văn bản và độ tin cậy
#             text = detection[1]
#             text = text.encode('utf-8').decode('utf-8')
#             confidence = detection[2]

#             # Vẽ văn bản lên hình ảnh
#             draw.text((tl[0], tl[1] - 15), text, font=font, fill=(0, 0, 0))

#         # Chuyển đổi lại từ Pillow Image sang NumPy array để hiển thị với OpenCV
#         image_with_text = np.array(image_pil)

#         # Hiển thị hình ảnh trên giao diện PyQt5
#         h, w, ch = image_with_text.shape
#         bytes_per_line = ch * w
#         q_image = QImage(image_with_text.data, w, h, bytes_per_line, QImage.Format_RGB888)
#         pixmap = QPixmap.fromImage(q_image)
#         self.label.setPixmap(pixmap)
#         self.progress_bar.hide()

# if __name__ == '__main__':
#     app = QApplication(sys.argv)
#     ocr_app = OCRApp()
#     ocr_app.show()
#     sys.exit(app.exec_())

