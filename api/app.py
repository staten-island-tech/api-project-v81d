import base64
import hashlib
import hmac
import os
import time
import traceback

import cv2
import numpy as np
import torch
from dotenv import load_dotenv
from fer.fer import FER
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from rich.console import Console
from rich.panel import Panel

load_dotenv()

api_secret = os.getenv("API_SECRET", "")

console = Console()
console.clear()

panel = Panel.fit(
    f"[bold yellow]Your API secret is: [cyan]{api_secret}[/]\n"
    "[red bold]Do not share this secret with unauthorized users![/]",
    title="Session Secret",
    border_style="yellow",
)

console.print(panel)

app = Flask(__name__)

app.config["MAX_CONTENT_LENGTH"] = 2 * 1024 * 1024  # 2 MB
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg"}

origins = os.getenv("ALLOWED_ORIGINS", "").split("|")
CORS(app, resources={r"/*": {"origins": origins}})

# Rate limiter
limiter = Limiter(
    get_remote_address,
    app=app,
    headers_enabled=True,
    storage_uri="memory://",
)
limiter.init_app(app)

torch.backends.cudnn.enabled = False  # no CUDA

detector = FER(mtcnn=True)  # load globally


def generate_handshake_token(secret: str, validity_seconds: int = 60) -> str:
    timestamp = int(time.time())
    expires = timestamp + validity_seconds
    message = str(expires).encode()
    signature = hmac.new(secret.encode(), message, hashlib.sha256).digest()
    token = base64.urlsafe_b64encode(message + b"." + signature).decode()

    return token


def validate_image(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route("/predict", methods=["POST"])
@limiter.limit("1 per 10 second")
def predict():
    auth_header = request.headers.get("Authorization", "")

    if auth_header != f"Bearer {api_secret}":
        return jsonify({"error": "Invalid or missing API token."}), 401

    if "image" not in request.files:
        return jsonify({"error": "No image uploaded."}), 400

    file = request.files["image"]

    try:
        img_bytes = file.read()
        np_img = np.frombuffer(img_bytes, np.uint8)
        image = cv2.imdecode(np_img, cv2.IMREAD_COLOR)

        if image is None:
            return jsonify({"error": "Could not decode image."}), 400

        results = detector.detect_emotions(image)

        if not results:
            return jsonify({"error": "No faces detected."}), 400

        result = results[0]
        top_emotion, _ = detector.top_emotion(image)

        return jsonify(
            {
                **result,
                "topEmotion": top_emotion,
                "handshake": generate_handshake_token(api_secret),
            }
        )
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
