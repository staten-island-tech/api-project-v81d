import glob

import numpy as np
from joblib import Parallel, delayed, dump
from skimage.io import imread
from sklearn.linear_model import SGDClassifier
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split
from tqdm import tqdm

from utils.hog_transformer import HOGTransformer

hog = HOGTransformer()
batch_size = 512


def image_generator(paths, label):
    for file in paths:
        image = imread(file).astype("float32") / 255.0
        yield image, label


negative_generator = image_generator(glob.glob("datasets/negative/*.jpg"), -1)
neutral_generator = image_generator(glob.glob("datasets/neutral/*.jpg"), 0)
positive_generator = image_generator(glob.glob("datasets/positive/*.jpg"), 1)


def combined_generator():
    for generator in [negative_generator, neutral_generator, positive_generator]:
        for image, label in generator:
            yield image, label


def process_image_label(image_label):
    image, label = image_label
    fd = hog.transform(image)
    return fd, label


X_list = []
y_list = []

generator = combined_generator()

progress_bar = tqdm(
    total=len(glob.glob("datasets/negative/*.jpg"))
    + len(glob.glob("datasets/neutral/*.jpg"))
    + len(glob.glob("datasets/positive/*.jpg")),
    desc="Running HOG transforms",
)

while True:
    batch = []
    try:
        for _ in range(batch_size):
            batch.append(next(generator))
    except StopIteration:
        pass  # no more

    if not batch:
        break

    results = Parallel(n_jobs=-1)(delayed(process_image_label)(item) for item in batch)
    X_batch, y_batch = zip(*results)
    X_list.append(np.array(X_batch))
    y_list.append(np.array(y_batch))

    progress_bar.update(len(batch))

progress_bar.close()

X = np.vstack(X_list)
y = np.concatenate(y_list)

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, shuffle=True
)

clf = SGDClassifier(loss="hinge", max_iter=1000, tol=1e-3, verbose=1)
clf.fit(X_train, y_train)

dump(clf, "hog_svm_model.joblib")

y_pred = clf.predict(X_test)
print(classification_report(y_test, y_pred))
