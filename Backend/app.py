from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import tensorflow as tf
import scipy.spatial.distance
import cv2
import os
from PIL import Image, ImageOps
from tensorflow.keras.applications.resnet50 import preprocess_input
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.applications.mobilenet_v2 import (
    preprocess_input as mobilenet_preprocess,
    decode_predictions
)

app = Flask(__name__)
CORS(app)

# ── Paths ────────────────────────────────────────────────────────────────
MODEL_PATH = "resnet50_best.keras"
OOD_DIR    = "ood_references"
CLASSES    = ["demodicosis", "dermatitis", "ringworm", "healthy"]

DISEASE_INFO = {
    "demodicosis": {
        "full_name"  : "Demodicosis (Demodectic Mange)",
        "description": "Caused by Demodex mites. Leads to hair loss and skin irritation.",
        "severity"   : "Moderate",
        "color"      : "#FF9800"
    },
    "dermatitis": {
        "full_name"  : "Dermatitis",
        "description": "Inflammation of the skin due to allergies, infections, or irritants.",
        "severity"   : "Moderate",
        "color"      : "#F44336"
    },
    "ringworm": {
        "full_name"  : "Ringworm (Dermatophytosis)",
        "description": "Contagious fungal infection causing circular, scaly bald patches.",
        "severity"   : "High",
        "color"      : "#E91E63"
    },
    "healthy": {
        "full_name"  : "Healthy Skin",
        "description": "No skin disease detected. Your dog's skin appears healthy.",
        "severity"   : "None",
        "color"      : "#4CAF50"
    }
}

# ── Load everything on startup ───────────────────────────────────────────
print("Loading ResNet50 model...")
best_model = tf.keras.models.load_model(MODEL_PATH)
embedding_model = tf.keras.Model(
    inputs=best_model.input,
    outputs=best_model.layers[2].output
)

print("Loading MobileNetV2 dog detector...")
dog_detector = MobileNetV2(weights="imagenet", include_top=True)

print("Loading OOD references...")
mean_embedding    = np.load(os.path.join(OOD_DIR, "mean_embedding.npy"))
inv_cov           = np.load(os.path.join(OOD_DIR, "inv_cov.npy"))
OOD_THRESHOLD     = np.load(os.path.join(OOD_DIR, "ood_threshold.npy")).item()
CONF_THRESHOLD    = np.load(os.path.join(OOD_DIR, "conf_threshold.npy")).item()
ENTROPY_THRESHOLD = np.load(os.path.join(OOD_DIR, "entropy_threshold.npy")).item()

DOG_CAT_RATIO_THRESHOLD = 1.0
CAT_PROB_THRESHOLD      = 0.20

print(f"[OK] All loaded.")
print(f"   OOD threshold:  {OOD_THRESHOLD:.2f}")
print(f"   Confidence:     {CONF_THRESHOLD*100:.0f}%")
print(f"   Entropy:        {ENTROPY_THRESHOLD}")


# ── Helper functions ─────────────────────────────────────────────────────
def check_quality(pil_img, blur_threshold=20.0,
                  brightness_range=(10, 250)):
    img  = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape
    cy, cx = h//2, w//2
    crop = gray[cy-h//4:cy+h//4, cx-w//4:cx+w//4]
    blur = cv2.Laplacian(crop, cv2.CV_64F).var()
    if blur < blur_threshold:
        return False, f"too blurry (score={blur:.1f})"
    brightness = gray.mean()
    if not (brightness_range[0] <= brightness <= brightness_range[1]):
        return False, f"bad exposure (brightness={brightness:.1f})"
    return True, "ok"


def preprocess(pil_img):
    w, h = pil_img.size
    if w < h:
        new_w, new_h = 256, int(256*h/w)
    else:
        new_w, new_h = int(256*w/h), 256
    pil_img = pil_img.resize((new_w, new_h), Image.BILINEAR)
    left    = (new_w-224)//2
    top     = (new_h-224)//2
    pil_img = pil_img.crop((left, top, left+224, top+224))
    arr     = np.array(pil_img, dtype=np.float32)
    return np.expand_dims(preprocess_input(arr), axis=0)


def check_dog(pil_img):
    img_r = pil_img.resize((224, 224), Image.BILINEAR)
    arr   = np.array(img_r, dtype=np.float32)
    batch = np.expand_dims(mobilenet_preprocess(arr), axis=0)
    preds = dog_detector.predict(batch, verbose=0)
    dog_p = float(np.sum(preds[0][151:269]))
    cat_p = float(np.sum(preds[0][281:286]))
    ratio = dog_p / max(cat_p, 0.0001)
    is_dog = (cat_p < CAT_PROB_THRESHOLD) and \
             (ratio > DOG_CAT_RATIO_THRESHOLD)
    return is_dog, dog_p, cat_p, ratio


def multicrop_predict(pil_img):
    w, h  = pil_img.size
    crops = {
        "center"      : (w//4,  h//4,  3*w//4, 3*h//4),
        "top_left"    : (0,     0,     w//2,   h//2),
        "top_right"   : (w//2,  0,     w,      h//2),
        "bottom_left" : (0,     h//2,  w//2,   h),
        "bottom_right": (w//2,  h//2,  w,      h),
    }
    all_preds = []
    for box in crops.values():
        crop  = pil_img.crop(box).resize((224, 224), Image.BILINEAR)
        arr   = preprocess_input(np.array(crop, dtype=np.float32))
        preds = best_model.predict(np.expand_dims(arr, 0), verbose=0)[0]
        all_preds.append(preds)
    return np.mean(all_preds, axis=0)


# ── Health check endpoint ────────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "model" : "DermPaw AI ResNet50"
    })


# ── Main prediction endpoint ─────────────────────────────────────────────
@app.route("/predict", methods=["POST"])
def predict():
    if "image" not in request.files:
        return jsonify({
            "status" : "error",
            "message": "No image provided"
        }), 400

    file    = request.files["image"]
    pil_img = Image.open(file.stream)
    pil_img = ImageOps.exif_transpose(pil_img)
    pil_img = pil_img.convert("RGB")

    # Stage 1: Quality check
    ok, reason = check_quality(pil_img)
    if not ok:
        return jsonify({
            "status" : "rejected",
            "stage"  : "quality",
            "reason" : reason,
            "message": "Image quality too low. Please retake in good lighting."
        })

    # Stage 2: Dog detector
    is_dog, dog_p, cat_p, ratio = check_dog(pil_img)
    if not is_dog:
        return jsonify({
            "status" : "rejected",
            "stage"  : "dog_detector",
            "message": "Please upload a photo of a dog's skin."
        })

    # Stage 3: OOD check
    img_batch = preprocess(pil_img)
    embedding = embedding_model.predict(img_batch, verbose=0)[0]
    ood_dist  = scipy.spatial.distance.mahalanobis(
                    embedding, mean_embedding, inv_cov)

    if ood_dist > OOD_THRESHOLD:
        return jsonify({
            "status" : "unknown",
            "stage"  : "ood",
            "message": "We could not identify this skin condition. "
                       "Please consult a veterinarian for proper diagnosis.",
            "action" : "consult_vet"
        })

    # Stage 4: Multi-crop classification
    avg_preds  = multicrop_predict(pil_img)
    confidence = float(np.max(avg_preds))
    pred_class = CLASSES[np.argmax(avg_preds)]
    all_scores = {
        cls: round(float(avg_preds[i]) * 100, 1)
        for i, cls in enumerate(CLASSES)
    }

    entropy       = -np.sum(avg_preds * np.log(avg_preds + 1e-10))
    entropy_ratio = entropy / np.log(len(CLASSES))

    if entropy_ratio > ENTROPY_THRESHOLD:
        return jsonify({
            "status" : "retake",
            "stage"  : "entropy",
            "message": "Image unclear — please photograph the "
                       "affected skin area closely.",
            "tip"    : "Get 15-30cm closer to the affected area and retake."
        })

    # Stage 5: Confidence check
    if confidence < CONF_THRESHOLD:
        return jsonify({
            "status" : "retake",
            "stage"  : "confidence",
            "message": "Image unclear — please photograph the "
                       "affected skin area closely.",
            "tip"    : "Get 15-30cm closer to the affected area and retake."
        })

    # ── Success — return prediction ──────────────────────────────────────
    disease_info = DISEASE_INFO.get(pred_class, {})
    return jsonify({
        "status"      : "predicted",
        "disease"     : pred_class,
        "confidence"  : round(confidence * 100, 1),
        "all_scores"  : all_scores,
        "disease_info": disease_info,
        "message"     : f"Detected: {disease_info.get('full_name', pred_class)}. "
                        "Please consult a veterinarian for confirmation."
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)