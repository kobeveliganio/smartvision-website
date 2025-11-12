from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from ultralytics import YOLO
from PIL import Image
import io
import base64

app = Flask(__name__)
CORS(app)

# Global model variable
model = None

# Lazy load model function
def get_model():
    global model
    if model is None:
        try:
            MODEL_PATH = os.path.join(os.path.dirname(__file__), "best.pt")  # or download from Supabase
            model = YOLO(MODEL_PATH)
            print("✅ YOLO model loaded successfully.")
        except Exception as e:
            print("❌ Failed to load model:", e)
            model = None
    return model

@app.route("/")
def home():
    return jsonify({"status": "ML API running!"})

@app.route("/predict", methods=["POST"])
def predict():
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files["file"]
        pil_image = Image.open(file.stream).convert("RGB")
        
        model_instance = get_model()
        if model_instance is None:
            return jsonify({"error": "Model failed to load"}), 500

        results = model_instance.predict(pil_image, verbose=False)
        
        # Collect predictions
        predictions = []
        for box in results[0].boxes:
            cls_id = int(box.cls[0])
            label = results[0].names[cls_id]
            confidence = float(box.conf[0])
            predictions.append({"label": label, "confidence": confidence})
        
        # Annotated image (optional)
        annotated_img = results[0].plot()
        _, buffer = cv2.imencode(".jpg", annotated_img)
        img_b64 = base64.b64encode(buffer).decode("utf-8")

        return jsonify({
            "annotated_image_base64": img_b64,
            "predictions": predictions
        })

    except Exception as e:
        print("🔥 Predict error:", e)
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    # Single worker, long timeout for heavy processing
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
