import tensorflow as tf
import numpy as np
import cv2

model = tf.keras.models.load_model("resnet50_best.keras")
resnet_sub = model.get_layer("resnet50")
last_conv = resnet_sub.get_layer("conv5_block3_out")

print("resnet_sub output == last_conv output?", resnet_sub.output == last_conv.output)

# Head layers
gap = model.get_layer("global_average_pooling2d_2")
bn = model.get_layer("batch_normalization_2")
d6 = model.get_layer("dense_6")
d7 = model.get_layer("dense_7")
d8 = model.get_layer("dense_8")

# Let's test Grad-CAM with pre-softmax logits vs post-softmax
img_input = tf.random.normal((1, 224, 224, 3))

with tf.GradientTape() as tape:
    # 1. Forward through resnet
    conv_out = resnet_sub(img_input, training=False)
    tape.watch(conv_out)
    
    # 2. Forward through head
    x = gap(conv_out)
    x = bn(x, training=False)
    x = d6(x)
    x = d7(x)
    
    # Pre-softmax logits
    logits = tf.matmul(x, d8.kernel) + d8.bias
    probs = d8(x)
    
    target_class = 1 # e.g. dermatitis
    target_logit = logits[:, target_class]
    target_prob = probs[:, target_class]

grads_logit = tape.gradient(target_logit, conv_out)
print("Gradients from Logits shape:", grads_logit.shape)
print("Gradients from Logits min/max/mean:", np.min(grads_logit), np.max(grads_logit), np.mean(np.abs(grads_logit)))

# Test heatmap calculation
pooled_grads = tf.reduce_mean(grads_logit, axis=(0, 1, 2))
heatmap = conv_out[0] @ pooled_grads[..., tf.newaxis]
heatmap = tf.squeeze(heatmap)
heatmap = tf.maximum(heatmap, 0.0).numpy()
print("Heatmap shape:", heatmap.shape)
print("Heatmap min/max:", np.min(heatmap), np.max(heatmap))
