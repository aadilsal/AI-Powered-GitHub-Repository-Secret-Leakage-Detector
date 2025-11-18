import joblib
import os

_model = None


def load_model(path: str = None):
    global _model
    if _model is not None:
        return _model

    # Default model path: two levels up from ml-backend (repo root)
    if path is None:
        base = os.path.dirname(__file__)
        path = os.path.join(base, '..', '..', 'secret_detector_model.pkl')
        path = os.path.abspath(path)

    if not os.path.exists(path):
        raise FileNotFoundError(f"Model file not found at {path}")

    _model = joblib.load(path)
    return _model


def get_model():
    if _model is None:
        return load_model()
    return _model
