"""
Scan schemas
"""
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime


class ScanBase(BaseModel):
    filename: Optional[str] = "Live Scan"
    original_filename: Optional[str] = None
    template_id: Optional[str] = None
    targets: Optional[str] = None
    folder: Optional[str] = None
    schedule: Optional[str] = None


class ScanCreate(ScanBase):
    pass


class ScanLaunchRequest(BaseModel):
    template_id: str
    name: str
    description: Optional[str] = ""
    targets: str  # Comma or newline separated target domains/subdomains/IPs
    folder: Optional[str] = "My Scans"
    schedule: Optional[str] = "Now"
    email_notification: Optional[bool] = False


class ScanList(ScanBase):
    id: int
    status: str
    upload_time: datetime
    file_size: Optional[int] = None
    
    class Config:
        from_attributes = True


class ScanResponse(ScanBase):
    id: int
    user_id: int
    status: str
    upload_time: datetime
    processed_at: Optional[datetime] = None
    file_size: Optional[int] = None
    parsed_data: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None

    class Config:
        from_attributes = True


class ScanHost(BaseModel):
    host: str
    fqdn: Optional[str] = None
    ports: List[int] = []