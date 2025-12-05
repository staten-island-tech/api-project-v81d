from flask import Flask, jsonify, request
from joblib import load
from skimage.io import imread

from utils.hog_transformer import HOGTransformer

hog = HOGTransformer()
classifier = load("hog_svm_model.joblib")

app = Flask(__name__)

app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16 MB
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}


def validate_image(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route("/predict", methods=["POST"])
def predict():
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded."}), 400

    file = request.files["image"]

    try:
        image = imread(file).astype("float32") / 255.0

        fd = hog.transform(image).reshape(1, -1)
        pred = classifier.predict(fd)[0]

        return jsonify({"prediction": int(pred)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
