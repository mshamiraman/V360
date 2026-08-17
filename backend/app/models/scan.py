"""
Scan model
"""
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Scan(Base):
    __tablename__ = "scans"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=True)
    original_filename = Column(String, nullable=True)
    template_id = Column(String, nullable=True)
    targets = Column(Text, nullable=True)
    folder = Column(String, nullable=True)
    schedule = Column(String, nullable=True)
    file_size = Column(Integer, nullable=True)
    status = Column(String, default="processing")  # created, processing, completed, failed, cancelled
    raw_data = Column(Text, nullable=True)  # Original XML content or scan config
    parsed_data = Column(JSON, nullable=True)  # Parsed JSON data
    upload_time = Column(DateTime(timezone=True), server_default=func.now())
    processed_at = Column(DateTime(timezone=True))
    error_message = Column(Text, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="scans")
    vulnerabilities = relationship("Vulnerability", back_populates="scan")
    reports = relationship("Report", back_populates="scan")
    feedback = relationship("Feedback", back_populates="scan")