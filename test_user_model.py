#!/usr/bin/env python3
"""
Test script to verify the updated User model with company_name field
"""

import sys
import os
sys.path.append('/app')

from backend.server import UserCreate, User

def test_user_models():
    print("Testing UserCreate model...")
    
    # Test UserCreate with company_name
    user_create = UserCreate(
        email="test@company.com",
        password="password123",
        name="Test User",
        role="company",
        company_name="Test Company Ltd"
    )
    
    print(f"UserCreate model: {user_create.model_dump()}")
    
    # Test UserCreate without company_name (should use default)
    user_create_default = UserCreate(
        email="test2@company.com",
        password="password123",
        name="Test User 2",
        role="company"
    )
    
    print(f"UserCreate model (default company_name): {user_create_default.model_dump()}")
    
    # Test User model
    user = User(
        id="123",
        email="test@company.com",
        name="Test User",
        role="company",
        company_name="Test Company Ltd",
        created_at="2024-01-01T00:00:00Z"
    )
    
    print(f"User model: {user.model_dump()}")
    
    print("✅ All user model tests passed!")

if __name__ == "__main__":
    test_user_models()