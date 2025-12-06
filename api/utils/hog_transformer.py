from skimage.color import rgb2gray
from skimage.exposure import equalize_adapthist
from skimage.feature import hog
from skimage.transform import resize
from sklearn.base import BaseEstimator, TransformerMixin


class HOGTransformer(BaseEstimator, TransformerMixin):
    def __init__(
        self,
        resize_shape=(64, 64),
        pixels_per_cell=(6, 6),
        cells_per_block=(3, 3),
    ):
        self.resize_shape = resize_shape
        self.pixels_per_cell = pixels_per_cell
        self.cells_per_block = cells_per_block

    def fit(self, X, y=None):
        return self

    def transform(self, image):
        image_resized = resize(image, self.resize_shape)

        if image_resized.ndim == 3:
            image_resized = rgb2gray(image_resized)

        image_resized = equalize_adapthist(image_resized)

        fd = hog(
            image_resized,
            pixels_per_cell=self.pixels_per_cell,
            cells_per_block=self.cells_per_block,
        )
        return fd
