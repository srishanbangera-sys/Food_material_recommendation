from sqlalchemy import text


def get_food(engine, food_type: str):
    with engine.connect() as conn:
        result = conn.execute(
            text("SELECT * FROM food WHERE food_type = :food_type"),
            {"food_type": food_type}
        ).mappings().first()
    return dict(result) if result else None


def get_packaging(engine, packaging_type: str):
    with engine.connect() as conn:
        result = conn.execute(
            text("SELECT * FROM packaging WHERE packaging_type = :packaging_type"),
            {"packaging_type": packaging_type}
        ).mappings().first()
    return dict(result) if result else None