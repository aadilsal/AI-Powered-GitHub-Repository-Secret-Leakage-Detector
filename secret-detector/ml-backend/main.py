from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import uvicorn

from feature_extractor import extract_features
from model_loader import load_model, get_model

app = FastAPI()

class TextIn(BaseModel):
    text: str

class PredictOut(BaseModel):
    prediction: int
    confidence: float
    features: List[float]


@app.on_event("startup")
async def startup_event():
    # attempt to load model at startup
    try:
        load_model()
        print("Model loaded into memory")
    except Exception as e:
        print(f"Warning: could not load model on startup: {e}")


@app.post('/predict', response_model=PredictOut)
async def predict(inobj: TextIn):
    text = inobj.text or ""
    print(f"ML server: /predict called text_len={len(text)}")
    features = extract_features(text)

    model = get_model()
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded")

    # Some sklearn models expose predict_proba
    try:
        proba = None
        if hasattr(model, 'predict_proba'):
            proba = model.predict_proba([features])
            # take positive class probability if binary
            if proba.shape[1] == 2:
                confidence = float(proba[0, 1])
            else:
                confidence = float(proba[0].max())
        else:
            confidence = 0.5
        pred = int(model.predict([features])[0])
        print(f"ML server: prediction={pred} confidence={confidence}")
    except Exception as e:
        # fallback: return neutral
        pred = 0
        confidence = 0.0
        print(f"ML server: prediction failed: {e}")

    return PredictOut(prediction=pred, confidence=confidence, features=features)


if __name__ == '__main__':
    uvicorn.run('main:app', host='127.0.0.1', port=8000, reload=False)
