import os

import numpy as np
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from joblib import load
from skimage.io import imread
from sklearnex import patch_sklearn

from utils.color_lbp_extractor import extract_color_lbp
from utils.hog_transformer import HOGTransformer

load_dotenv()

app = Flask(__name__)

app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16 MB
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg"}

origins = os.getenv("ALLOWED_ORIGINS", "").split("|")
CORS(app, resources={r"/*": {"origins": origins}})

# Settings
root = input("Root Directory: ")

patch_sklearn()  # for Intel CPUs

hog = HOGTransformer()
classifier = load(os.path.join(root, "moodlens_model.joblib"))


def validate_image(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route("/predict", methods=["POST"])
def predict():
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded."}), 400

    file = request.files["image"]

    try:
        image = imread(file)

        if image.ndim == 2:
            image = np.stack([image] * 3, axis=-1)
        elif image.shape[2] == 4:
            image = image[..., :3]

        lbp_features = extract_color_lbp(image)
        hog_features = hog.transform(image)
        features = np.hstack([lbp_features, hog_features]).reshape(1, -1)

        pred = classifier.predict(features)[0]
        proba = classifier.predict_proba(features)[0]

        return jsonify({"prediction": pred, "confidence": float(proba.max())})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
