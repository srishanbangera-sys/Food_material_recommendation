from sqlalchemy import text
from database import engine

CREATE_FOOD_TABLE = """
CREATE TABLE IF NOT EXISTS food (
    food_id INTEGER PRIMARY KEY AUTOINCREMENT,
    food_type TEXT UNIQUE NOT NULL,
    respiration_rate TEXT,
    ethylene_production TEXT,
    ethylene_sensitivity TEXT,
    moisture_content_pct REAL,
    ph_level REAL,
    chilling_sensitivity TEXT,
    mechanical_fragility TEXT
);
"""

CREATE_PACKAGING_TABLE = """
CREATE TABLE IF NOT EXISTS packaging (
    packaging_id INTEGER PRIMARY KEY AUTOINCREMENT,
    packaging_type TEXT UNIQUE NOT NULL,
    material_type TEXT,
    otr REAL,
    wvtr REAL
);
"""

CREATE_SHELF_LIFE_TABLE = """
CREATE TABLE IF NOT EXISTS shelf_life_data (
    record_id INTEGER PRIMARY KEY AUTOINCREMENT,
    food_id INTEGER REFERENCES food(food_id),
    packaging_id INTEGER REFERENCES packaging(packaging_id),
    temperature_c REAL,
    humidity_pct REAL,
    shelf_life_days REAL
);
"""

with engine.connect() as conn:
    conn.execute(text(CREATE_FOOD_TABLE))
    conn.execute(text(CREATE_PACKAGING_TABLE))
    conn.execute(text(CREATE_SHELF_LIFE_TABLE))
    conn.commit()

print("Tables created successfully.")