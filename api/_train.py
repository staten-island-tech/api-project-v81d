# %%
# Import packages and modules

import glob
import os

import numpy as np
from joblib import dump, load
from skimage.io import imread
from sklearn.calibration import CalibratedClassifierCV
from sklearn.linear_model import SGDClassifier
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split
from sklearnex import patch_sklearn
from tqdm import tqdm

from utils.color_lbp_extractor import extract_color_lbp
from utils.hog_transformer import HOGTransformer

# %%
# Path/location definitions

root = input("Root Directory: ")

# %%
# Definitions

hog = HOGTransformer()

patch_sklearn()  # for Intel CPUs


def image_generator(paths, label):
    for file in paths:
        image = imread(file)
        yield image, label


def create_generators(datasets_path):
    generators = []

    for subfolder in os.listdir(datasets_path):
        subfolder_path = os.path.join(datasets_path, subfolder)
        if not os.path.isdir(subfolder_path):
            continue  # skip files

        label = subfolder

        image_paths = glob.glob(os.path.join(subfolder_path, "*.jpg")) + glob.glob(
            os.path.join(subfolder_path, "*.png")
        )

        generators.append(image_generator(image_paths, label))

    return generators


def combined_generator(generators):
    for gen in generators:
        for image, label in gen:
            yield image, label


def process_image_label(image_label):
    image, label = image_label

    lbp_features = extract_color_lbp(image)
    hog_features = hog.transform(image)
    features = np.hstack([lbp_features, hog_features])

    return features, label


# %%
# Initialize generators

datasets_path = input("Datasets Path: ")

generators = create_generators(datasets_path)
generator = combined_generator(generators)

total_images = sum(
    len(glob.glob(os.path.join(datasets_path, folder, "*.jpg")))
    + len(glob.glob(os.path.join(datasets_path, folder, "*.png")))
    for folder in os.listdir(datasets_path)
    if os.path.isdir(os.path.join(datasets_path, folder))
)

# %%
# Extract feature embeddings with LBP

X_list = []
y_list = []

for image_label in tqdm(generator, total=total_images, desc="Extracting features"):
    features, label = process_image_label(image_label)
    X_list.append(features)
    y_list.append(label)

# %%
# Save embeddings to (X, y)

X = np.vstack(X_list)
y = np.array(y_list)

# %%
# Dump (X, y) to file

dump((X, y), os.path.join(root, "features.joblib"))

# %%
# Load (X, y) from file

X, y = load(os.path.join(root, "features.joblib"))

# %%
# Train the model

print("Starting model training...")

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, shuffle=True
)

sgd = SGDClassifier(
    loss="log_loss",
    max_iter=5000,
    tol=1e-4,
    random_state=42,
    class_weight="balanced",
    verbose=1,
)
clf = CalibratedClassifierCV(estimator=sgd, method="sigmoid", cv=5)
clf.fit(X_train, y_train)

# %%
# Dump model to file

dump(clf, os.path.join(root, "moodlens_model.joblib"))

# %%
# Create classification report

print("Creating classification report...")

y_pred = clf.predict(X_test)
# y_proba = clf.predict_proba(X_test)

print(classification_report(y_test, y_pred))
