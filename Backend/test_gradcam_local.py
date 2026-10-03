"""
Local Grad-CAM Verification Test
"""
import tensorflow as tf
import numpy as np
import cv2
import os
from PIL import Image, ImageDraw

# Create synthetic realistic image if test_dog.jpg does not exist
if not os.path.exists("test_dog.jpg"):
    img = Image.new("RGB", (300, 300), color=(160, 110, 80))
    draw = ImageDraw.Draw(img)
    draw.ellipse([80, 80, 220, 220], fill=(210, 60, 60), outline=(100, 20, 20))
    img.save("test_dog.jpg")

from app import (
    best_model,
    resnet_submodel,
    head_layers,
    final_dense_layer,
    FINAL_CONV_LAYER_NAME,
    CLASS_NAMES,
    preprocess,
    multicrop_predict,
    generate_gradcam_base64
)

pil_img = Image.open("test_dog.jpg").convert("RGB")

# 1. Prediction
avg_preds = multicrop_predict(pil_img)
pred_idx = int(np.argmax(avg_preds))
pred_class = CLASS_NAMES[pred_idx]
conf = float(avg_preds[pred_idx]) * 100

# 2. Detailed Tensor diagnostics
img_tensor = tf.constant(preprocess(pil_img), dtype=tf.float32)

with tf.GradientTape() as tape:
    conv_outputs = resnet_submodel(img_tensor, training=False)
    tape.watch(conv_outputs)
    x = conv_outputs
    for layer in head_layers:
        if layer == final_dense_layer:
            logits = tf.matmul(x, final_dense_layer.kernel) + final_dense_layer.bias
            break
        x = layer(x, training=False)
    target_score = logits[:, pred_idx]

grads = tape.gradient(target_score, conv_outputs)
pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))
conv_val = conv_outputs[0]
heatmap = conv_val @ pooled_grads[..., tf.newaxis]
heatmap = tf.squeeze(heatmap)
heatmap = tf.maximum(heatmap, 0.0).numpy()

# 3. Generate and save overlay
gradcam_b64 = generate_gradcam_base64(pil_img, pred_idx)

# Decode base64 and save as gradcam_test.jpg
import base64
if gradcam_b64:
    raw_data = base64.b64decode(gradcam_b64.split(",")[1])
    with open("gradcam_test.jpg", "wb") as f:
        f.write(raw_data)
    generated = "YES"
else:
    generated = "NO"

print("\n" + "=" * 50)
print(f"Predicted class:    {pred_class}")
print(f"Confidence:         {conf:.2f}%")
print(f"Target layer:       {FINAL_CONV_LAYER_NAME}")
print(f"Feature map shape:  {conv_outputs.shape}")
print(f"Gradient shape:     {grads.shape}")
print(f"Heatmap min:        {np.min(heatmap):.4f}")
print(f"Heatmap max:        {np.max(heatmap):.4f}")
print(f"Grad-CAM generated: {generated}")
print("Saved overlay to:   gradcam_test.jpg")
print("=" * 50)
