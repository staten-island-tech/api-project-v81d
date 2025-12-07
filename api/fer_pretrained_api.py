import os
import traceback

import cv2
import numpy as np
import torch
from dotenv import load_dotenv
from fer.fer import FER
from flask import Flask, jsonify, request
from flask_cors import CORS

load_dotenv()

app = Flask(__name__)

app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16 MB
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg"}

origins = os.getenv("ALLOWED_ORIGINS", "").split("|")
CORS(app, resources={r"/*": {"origins": origins}})

torch.backends.cudnn.enabled = False


def validate_image(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route("/predict", methods=["POST"])
def predict():
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded."}), 400

    file = request.files["image"]

    try:
        img_bytes = file.read()
        np_img = np.frombuffer(img_bytes, np.uint8)
        image = cv2.imdecode(np_img, cv2.IMREAD_COLOR)

        if image is None:
            return jsonify({"error": "Could not decode image."}), 400

        detector = FER(mtcnn=True)

        result = detector.detect_emotions(image)[0]
        top_emotion, _ = detector.top_emotion(image)

        return jsonify({ **result, "top_emotion": top_emotion })
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
