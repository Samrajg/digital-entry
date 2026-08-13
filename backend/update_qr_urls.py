import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.qr_code import QRCode

engine = create_engine("postgresql://postgres:postgres@localhost:5432/digital_entry")
Session = sessionmaker(bind=engine)
db = Session()

qrs = db.query(QRCode).all()
for qr in qrs:
    qr.destination_url = f"https://deep-boxes-dig.loca.lt/entry/{qr.code}"

db.commit()
print("Updated all QRs to https://deep-boxes-dig.loca.lt")
