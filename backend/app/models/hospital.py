from sqlalchemy import Column, String, Float, Boolean, Integer
from app.core.database import Base

class Hospital(Base):
    __tablename__ = "hospitals"

    hospital_id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    address = Column(String, nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    emergency_capability = Column(Boolean, default=True)
    specializations = Column(String, default="CARDIAC,TRAUMA,GENERAL")  # Comma-separated
    total_icu_beds = Column(Integer, default=20)
    available_icu_beds = Column(Integer, default=8)
    contact_phone = Column(String, default="+91 80 2345 6789")
    readiness_score = Column(Float, default=0.95)  # 0.0 to 1.0
