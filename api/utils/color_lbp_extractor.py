import cv2
import numpy as np
from skimage.feature import local_binary_pattern


def extract_color_lbp(image):
    P = 8
    R = 1

    channels = cv2.split(image)
    features = []

    for ch in channels:
        lbp = local_binary_pattern(ch, P, R, method="uniform")

        hist, _ = np.histogram(lbp.ravel(), bins=np.arange(0, P + 3), range=(0, P + 2))

        hist = hist.astype("float")
        hist /= hist.sum() + 1e-7

        features.append(hist)

    return np.hstack(features)
