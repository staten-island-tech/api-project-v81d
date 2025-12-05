# Face Classifier

Model, API, and frontend for classifying human faces and categorizing their expressions as positive (`1`), neutral (`0`), or negative (`-1`).

## The Model

The model used for this relies on HOG transformation on images. It uses `numpy`, `scikit-learn`, `scikit-image`, `joblib`, and `tqdm`.

### Datasets

A free dataset you can use to train the model can be found here: https://github.com/amrta-coder/LFW-emotion-dataset
