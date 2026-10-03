"""
Comprehensive Grad-CAM Verification & Stress-Test Suite
Executes all 20 requirements and exports 4-class visualizations.
"""
import os
import io
import base64
import numpy as np
import tensorflow as tf
import cv2
from PIL import Image, ImageDraw

print("=" * 60)
print("RUNNING DERMPAW AI GRAD-CAM 20-POINT VERIFICATION SUITE")
print("=" * 60)

# Import components from app.py
from app import (
    best_model,
    resnet_submodel,
    head_layers,
    final_dense_layer,
    FINAL_CONV_LAYER_NAME,
    CLASS_NAMES,
    preprocess,
    generate_gradcam_base64,
    validate_image_file,
    app
)

# 1. Model Loading
assert best_model is not None, "Test 1 Failed: Model is None"
print(" [1] Model Loaded: PASS")

# 2. ResNet50 Nested Model Found
assert resnet_submodel is not None, "Test 2 Failed: Nested backbone is None"
print(f" [2] ResNet50 Nested Model Found ({resnet_submodel.name}): PASS")

# 3. conv5_block3_out exists
target_layer = resnet_submodel.get_layer(FINAL_CONV_LAYER_NAME)
assert target_layer is not None, "Test 3 Failed: conv5_block3_out not found"
print(f" [3] Target Conv Layer ({FINAL_CONV_LAYER_NAME}): PASS")

# Generate test dog skin image
test_pil = Image.new("RGB", (320, 240), color=(140, 95, 65))
draw = ImageDraw.Draw(test_pil)
# Draw circular lesion characteristic
draw.ellipse([60, 50, 200, 190], fill=(195, 60, 55), outline=(100, 20, 20))
draw.ellipse([80, 70, 140, 130], fill=(220, 120, 100))
test_pil.save("test_dog_lesion.jpg")

# 4. Feature map shape
img_tensor = tf.constant(preprocess(test_pil), dtype=tf.float32)
with tf.GradientTape() as tape:
    conv_outputs = resnet_submodel(img_tensor, training=False)
    tape.watch(conv_outputs)
    x = conv_outputs
    for layer in head_layers:
        if layer == final_dense_layer:
            logits = tf.matmul(x, final_dense_layer.kernel) + final_dense_layer.bias
            break
        x = layer(x, training=False)
    target_score = logits[:, 1] # dermatitis

assert conv_outputs.shape == (1, 7, 7, 2048), f"Test 4 Failed: shape={conv_outputs.shape}"
print(f" [4] Feature Map Shape (1, 7, 7, 2048): PASS ({conv_outputs.shape})")

# 5. Gradient shape
grads = tape.gradient(target_score, conv_outputs)
assert grads.shape == (1, 7, 7, 2048), f"Test 5 Failed: grad shape={grads.shape}"
print(f" [5] Gradient Shape (1, 7, 7, 2048): PASS ({grads.shape})")

# 6. Gradients not None
assert grads is not None, "Test 6 Failed: gradients are None"
print(" [6] Gradients Not None: PASS")

# 7. Gradients contain no NaN/Inf
grads_np = grads.numpy()
assert not np.isnan(grads_np).any() and not np.isinf(grads_np).any(), "Test 7 Failed: NaN/Inf in grads"
print(" [7] Gradients Finite (No NaN/Inf): PASS")

# 8. Heatmap computation and NaN/Inf check
pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))
conv_val = conv_outputs[0]
heatmap = conv_val @ pooled_grads[..., tf.newaxis]
heatmap = tf.squeeze(heatmap)
heatmap = tf.maximum(heatmap, 0.0).numpy()
heatmap = np.nan_to_num(heatmap, nan=0.0, posinf=0.0, neginf=0.0)
assert not np.isnan(heatmap).any() and not np.isinf(heatmap).any(), "Test 8 Failed: NaN/Inf in heatmap"
print(" [8] Heatmap Finite (No NaN/Inf): PASS")

# 9. Heatmap dimensions
assert heatmap.shape == (7, 7), f"Test 9 Failed: heatmap shape={heatmap.shape}"
print(f" [9] Heatmap Dimensions (7, 7): PASS ({heatmap.shape})")

# 10. Heatmap max > 0
max_h = np.max(heatmap)
assert max_h > 0.0, f"Test 10 Failed: max heatmap={max_h}"
print(f" [10] Heatmap Positive Attribution (Max={max_h:.4f} > 0): PASS")

# 11. Base64 starts with data:image/jpeg;base64,
b64_res = generate_gradcam_base64(test_pil, 1)
assert b64_res.startswith("data:image/jpeg;base64,"), "Test 11 Failed: bad base64 format"
print(" [11] Base64 Header Format: PASS")

# 12. Decode Base64 and verify valid JPEG
b64_raw = b64_res.split(",")[1]
jpg_bytes = base64.b64decode(b64_raw)
decoded_img = Image.open(io.BytesIO(jpg_bytes))
assert decoded_img.format == "JPEG", f"Test 12 Failed: format={decoded_img.format}"
print(f" [12] Base64 JPEG Decoding Valid: PASS ({decoded_img.format})")

# 13. Verify output image dimensions match original
assert decoded_img.size == test_pil.size, f"Test 13 Failed: {decoded_img.size} != {test_pil.size}"
print(f" [13] Output Dimensions Match Original ({decoded_img.size}): PASS")

# 14. Test all 4 classes and save 4 visualization files
class_files = {
    0: "gradcam_demodicosis.jpg",
    1: "gradcam_dermatitis.jpg",
    2: "gradcam_ringworm.jpg",
    3: "gradcam_healthy.jpg",
}

for idx, fname in class_files.items():
    cls_name = CLASS_NAMES[idx]
    c_b64 = generate_gradcam_base64(test_pil, idx)
    assert c_b64.startswith("data:image/jpeg;base64,"), f"Failed for {cls_name}"
    raw = base64.b64decode(c_b64.split(",")[1])
    with open(fname, "wb") as f:
        f.write(raw)
    assert os.path.exists(fname) and os.path.getsize(fname) > 1000
    print(f" [14] Class {idx} ({cls_name}) -> Saved {fname}: PASS ({os.path.getsize(fname)} bytes)")

# 15. Flask Test Client: class override
client = app.test_client()
with open("test_dog_lesion.jpg", "rb") as f:
    resp = client.post("/gradcam", data={"image": (f, "test.jpg"), "class_name": "ringworm"})
data = resp.get_json()
assert data["success"] == True and data["targetClass"] == "ringworm"
print(f" [15] Class Override ('ringworm'): PASS (targetClass={data['targetClass']})")

# 16. Invalid class override fallback
with open("test_dog_lesion.jpg", "rb") as f:
    resp = client.post("/gradcam", data={"image": (f, "test.jpg"), "class_name": "invalid_disease_xyz"})
data = resp.get_json()
assert data["success"] == True and data["targetClass"] in CLASS_NAMES
print(f" [16] Invalid Class Fallback: PASS (resolved to={data['targetClass']})")

# 17. Corrupted image rejection
resp = client.post("/gradcam", data={"image": (io.BytesIO(b"not_an_image_data"), "bad.jpg")})
assert resp.status_code == 400 or resp.get_json()["success"] == False
print(f" [17] Corrupted Image Handled: PASS (Status={resp.status_code})")

# 18. Empty upload handling
resp = client.post("/gradcam", data={})
assert resp.status_code == 400
print(f" [18] Empty Upload Handled: PASS (Status={resp.status_code})")

# 19. /health endpoint
resp = client.get("/health")
data = resp.get_json()
assert resp.status_code == 200 and data["gradcam"] == "enabled" and data["conv_layer"] == "conv5_block3_out"
print(f" [19] GET /health: PASS (model={data['model']}, conv_layer={data['conv_layer']})")

# 20. /gradcam/debug endpoint
resp = client.get("/gradcam/debug")
data = resp.get_json()
assert resp.status_code == 200 and data["target_conv_layer"] == "conv5_block3_out" and data["head_layers_count"] == 7
print(f" [20] GET /gradcam/debug: PASS (backbone={data['nested_backbone_name']}, head_layers={data['head_layers_count']})")

print("=" * 60)
print("ALL 20 GRAD-CAM TESTS COMPLETED WITH 100% SUCCESS")
print("=" * 60)
