import joblib

model1 = joblib.load('models/packaging_classifier_pipeline.joblib')
label_encoder = joblib.load('models/packaging_label_encoder.joblib')
model2 = joblib.load('models/shelf_life_regressor_pipeline.joblib')

print("Models loaded successfully.")