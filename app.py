from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
from ultralytics import YOLO
from PIL import Image

# Initialize Flask app, point to React build folder
app = Flask(__name__, static_folder="dist", static_url_path="/")  # change "dist" if CRA uses "build"
CORS(app)

# Load YOLO model at startup (important: define globally)
MODEL_PATH = os.path.join(os.path.dirname(__file__), "best.pt")
model = YOLO(MODEL_PATH)

@app.route("/predict", methods=["POST"])
def predict():
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files["file"]
        image = Image.open(file.stream)

        results = model.predict(image)
        labels = [r.names[int(d.cls)] for r in results for d in r.boxes]
        return jsonify({"labels": labels})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Serve React frontend
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_react(path):
    file_path = os.path.join(app.static_folder, path)
    if path != "" and os.path.isfile(file_path):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, "index.html")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print("✅ Flask ML API is running!")  # logs only
    app.run(host="0.0.0.0", port=port)
