import pandas as pd
from database import engine

df1 = pd.read_csv('data/packaging_classifier_dataset.csv')
df2 = pd.read_csv('data/shelf_life_regressor_dataset.csv')

# --- Build unique FOOD rows (merge fields from both CSVs) ---
food_from_df1 = df1[['Food_Type', 'Respiration_Rate', 'Ethylene_Production',
                      'Ethylene_Sensitivity', 'Moisture_Content_Pct',
                      'Chilling_Sensitivity', 'Mechanical_Fragility']].drop_duplicates('Food_Type')

food_from_df2 = df2[['Food_Type', 'pH_Level']].drop_duplicates('Food_Type')

food_table = food_from_df1.merge(food_from_df2, on='Food_Type', how='left')
food_table.columns = ['food_type', 'respiration_rate', 'ethylene_production',
                       'ethylene_sensitivity', 'moisture_content_pct',
                       'chilling_sensitivity', 'mechanical_fragility', 'ph_level']

food_table.to_sql('food', engine, if_exists='append', index=False)
print(f'Loaded {len(food_table)} food rows.')

# --- Build unique PACKAGING rows ---
packaging_table = df2[['Packaging_Material_Type', 'OTR_cc_m2_day', 'WVTR_g_m2_day']].drop_duplicates('Packaging_Material_Type')
packaging_table.columns = ['packaging_type', 'otr', 'wvtr']
packaging_table['material_type'] = packaging_table['packaging_type']

packaging_table.to_sql('packaging', engine, if_exists='append', index=False)
print(f'Loaded {len(packaging_table)} packaging rows.')

# --- Build SHELF_LIFE_DATA rows (needs food_id and packaging_id lookups) ---
food_ids = pd.read_sql('SELECT food_id, food_type FROM food', engine)
packaging_ids = pd.read_sql('SELECT packaging_id, packaging_type FROM packaging', engine)

shelf_life = df2.merge(food_ids, left_on='Food_Type', right_on='food_type')
shelf_life = shelf_life.merge(packaging_ids, left_on='Packaging_Material_Type', right_on='packaging_type')

shelf_life_table = shelf_life[['food_id', 'packaging_id', 'Storage_Temperature_C',
                                'Relative_Humidity_Pct', 'Shelf_Life_Days']]
shelf_life_table.columns = ['food_id', 'packaging_id', 'temperature_c', 'humidity_pct', 'shelf_life_days']

shelf_life_table.to_sql('shelf_life_data', engine, if_exists='append', index=False)
print(f'Loaded {len(shelf_life_table)} shelf_life_data rows.')