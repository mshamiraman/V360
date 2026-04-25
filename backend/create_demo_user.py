#!/usr/bin/env python3
"""
Script to create demo user for VulnPatch AI
"""
import sys
import time
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError
from sqlalchemy import text
from app.core.database import SessionLocal
from app.services.auth_service import AuthService
from app.schemas.auth import UserCreate

def create_demo_user():
    """Create demo user if it doesn't exist"""
    
    # Retry logic for database connection
    max_retries = 5
    retry_delay = 2
    
    for attempt in range(max_retries):
        try:
            db: Session = SessionLocal()
            # Test database connection
            db.execute(text("SELECT 1"))
            break
        except OperationalError as e:
            if attempt < max_retries - 1:
                print(f"Database not ready (attempt {attempt + 1}/{max_retries}), retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
                continue
            else:
                print(f"ERROR: Could not connect to database after {max_retries} attempts")
                sys.exit(1)
    
    auth_service = AuthService(db)
    
    try:
        # Check if demo user already exists
        email = "demo@amanv360.ai"
        password = "demo123"
        
        existing_user = auth_service.get_user_by_email(email)
        if existing_user:
            print(f"INFO: User {email} already exists. Updating password...")
            # Use the auth service or directly update via DB
            from app.core.security import get_password_hash
            from sqlalchemy import update
            from app.models.user import User
            
            hashed_password = get_password_hash(password)
            db.execute(
                update(User).where(User.email == email).values(hashed_password=hashed_password)
            )
            db.commit()
            print(f"SUCCESS: Password updated for {email}!")
            return
        
        # Create demo user
        user_data = UserCreate(
            email=email,
            password=password,
            full_name="Demo User",
            role="admin"
        )
        
        user = auth_service.create_user(user_data)
        print(f"SUCCESS: Demo user created successfully!")
        print(f"   Email: {user.email}")
        print(f"   Role: {user.role}")
        print(f"   Password: {password}")
        
    except Exception as e:
        print(f"ERROR: Error creating demo user: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    create_demo_user()