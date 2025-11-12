from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from ultralytics import YOLO
from PIL import Image

app = Flask(__name__)
CORS(app)

# Load YOLO model at startup (important: define globally)
MODEL_PATH = os.path.join(os.path.dirname(__file__), "best.pt")
model = YOLO(MODEL_PATH)

@app.route("/")
def home():
    return "✅ Flask ML API is running!"

@app.route("/predict", methods=["POST"])
def predict():
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files["file"]
        image = Image.open(file.stream)

        results = model.predict(image)
        labels = [r.names[int(d.cls)] for d in results for d in d.boxes]
        return jsonify({"labels": labels})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
