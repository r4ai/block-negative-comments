from optimum.onnxruntime import ORTModelForFeatureExtraction

model = ORTModelForFeatureExtraction.from_pretrained(
    "tohoku-nlp/bert-base-japanese", 
    export=True
)
model.save_pretrained("dist/bert-base-japanese-onnx")
