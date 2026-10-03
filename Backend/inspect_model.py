import os
import tensorflow as tf

# ============================================================
# PATH
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(
    BASE_DIR,
    "dermpaw_e3_mobilenetv2.keras"
)

# ============================================================
# CHECK MODEL FILE
# ============================================================

print("=" * 70)
print("DERMPAW AI - E3 MODEL INSPECTION")
print("=" * 70)

print("\nModel path:")
print(MODEL_PATH)

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(
        f"\nModel file not found:\n{MODEL_PATH}"
    )

print("\nModel file found.")

size_mb = os.path.getsize(MODEL_PATH) / (1024 * 1024)

print(
    f"Model size: {size_mb:.2f} MB"
)

# ============================================================
# LOAD MODEL
# ============================================================

print("\nLoading model...")

model = tf.keras.models.load_model(
    MODEL_PATH
)

print("Model loaded successfully.")

# ============================================================
# BASIC INFORMATION
# ============================================================

print("\n" + "=" * 70)
print("BASIC MODEL INFORMATION")
print("=" * 70)

print(
    "Model name:",
    model.name
)

print(
    "Input shape:",
    model.input_shape
)

print(
    "Output shape:",
    model.output_shape
)

print(
    "Number of top-level layers:",
    len(model.layers)
)

print(
    "Total parameters:",
    f"{model.count_params():,}"
)

# ============================================================
# CLASS MAPPING
# ============================================================

CLASS_NAMES = [
    "demodicosis",
    "dermatitis",
    "healthy",
    "ringworm"
]

print("\n" + "=" * 70)
print("EXPECTED E3 CLASS MAPPING")
print("=" * 70)

for index, class_name in enumerate(CLASS_NAMES):
    print(
        f"{index} -> {class_name}"
    )

if model.output_shape[-1] != len(CLASS_NAMES):
    print(
        "\nWARNING: Output size does not match "
        "the expected 4 classes."
    )
else:
    print(
        "\n[OK] Model output matches 4 classes."
    )

# ============================================================
# TOP-LEVEL LAYERS
# ============================================================

print("\n" + "=" * 70)
print("TOP-LEVEL MODEL LAYERS")
print("=" * 70)

for index, layer in enumerate(model.layers):

    try:
        output_shape = layer.output.shape
    except Exception:
        output_shape = "Unknown"

    print(
        f"{index:02d} | "
        f"{layer.name:<35} | "
        f"{layer.__class__.__name__:<25} | "
        f"{output_shape}"
    )

# ============================================================
# FIND GLOBAL AVERAGE POOLING LAYER
# ============================================================

print("\n" + "=" * 70)
print("OOD EMBEDDING LAYER SEARCH")
print("=" * 70)

gap_layers = []

for index, layer in enumerate(model.layers):

    if isinstance(
        layer,
        tf.keras.layers.GlobalAveragePooling2D
    ):
        gap_layers.append(
            (index, layer)
        )

if not gap_layers:

    print(
        "No GlobalAveragePooling2D layer found."
    )

else:

    for index, layer in gap_layers:

        print(
            f"Found GAP layer:"
        )

        print(
            f"  Index : {index}"
        )

        print(
            f"  Name  : {layer.name}"
        )

        print(
            f"  Output: {layer.output.shape}"
        )

# ============================================================
# FIND MOBILENETV2 BACKBONE
# ============================================================

print("\n" + "=" * 70)
print("BACKBONE SEARCH")
print("=" * 70)

backbone_found = False

for index, layer in enumerate(model.layers):

    name = layer.name.lower()

    if "mobilenet" in name:

        backbone_found = True

        print(
            f"MobileNet layer found:"
        )

        print(
            f"  Index : {index}"
        )

        print(
            f"  Name  : {layer.name}"
        )

        print(
            f"  Type  : {layer.__class__.__name__}"
        )

        try:
            print(
                f"  Output: {layer.output.shape}"
            )
        except Exception:
            pass

if not backbone_found:
    print(
        "No MobileNet-named top-level layer found."
    )

# ============================================================
# TRAINABLE INFORMATION
# ============================================================

print("\n" + "=" * 70)
print("TRAINABLE INFORMATION")
print("=" * 70)

trainable_params = sum(
    tf.keras.backend.count_params(weight)
    for weight in model.trainable_weights
)

non_trainable_params = sum(
    tf.keras.backend.count_params(weight)
    for weight in model.non_trainable_weights
)

print(
    "Trainable parameters:",
    f"{trainable_params:,}"
)

print(
    "Non-trainable parameters:",
    f"{non_trainable_params:,}"
)

print(
    "Total:",
    f"{trainable_params + non_trainable_params:,}"
)

# ============================================================
# MODEL SUMMARY
# ============================================================

print("\n" + "=" * 70)
print("FULL MODEL SUMMARY")
print("=" * 70)

model.summary()

# ============================================================
# FINAL VALIDATION
# ============================================================

print("\n" + "=" * 70)
print("DERMPAW E3 VALIDATION")
print("=" * 70)

checks = {
    "Input is 224x224x3":
        tuple(model.input_shape[1:])
        == (224, 224, 3),

    "Output has 4 classes":
        model.output_shape[-1]
        == 4,

    "GAP layer exists":
        len(gap_layers)
        > 0,
}

for name, passed in checks.items():

    print(
        f"{'[PASS]' if passed else '[FAIL]'} {name}"
    )

print("\nInspection completed.")