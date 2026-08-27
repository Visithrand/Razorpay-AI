import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import uuid

from app.main import app
from app.database import Base, get_db
from app.models import User

# Setup in-memory sqlite for fast isolated testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_auth.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

def test_register_success():
    email = f"test_{uuid.uuid4()}@example.com"
    response = client.post("/api/auth/register", json={
        "name": "Test User",
        "email": email,
        "password": "securepassword123"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == email
    assert data["name"] == "Test User"
    assert data["role"] == "FINANCE_OPERATOR"
    
def test_register_duplicate_email():
    email = "duplicate@example.com"
    client.post("/api/auth/register", json={
        "name": "First User",
        "email": email,
        "password": "pwd"
    })
    
    response = client.post("/api/auth/register", json={
        "name": "Second User",
        "email": email,
        "password": "pwd2"
    })
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]

def test_login_success():
    email = "login_success@example.com"
    password = "supersecretpassword"
    
    client.post("/api/auth/register", json={
        "name": "Login User",
        "email": email,
        "password": password
    })
    
    response = client.post("/api/auth/login", json={
        "email": email,
        "password": password
    })
    assert response.status_code == 200
    assert "session_token" in response.cookies

def test_login_invalid_password():
    email = "login_invalid@example.com"
    
    client.post("/api/auth/register", json={
        "name": "Invalid Login User",
        "email": email,
        "password": "correctpassword"
    })
    
    response = client.post("/api/auth/login", json={
        "email": email,
        "password": "wrongpassword"
    })
    assert response.status_code == 401
    assert "Invalid credentials" in response.json()["detail"]

def test_protected_route_rejection():
    # Attempting to access an endpoint that requires authentication without cookies
    response = client.get("/api/auth/me")
    assert response.status_code == 401

def test_logout():
    email = "logout@example.com"
    password = "pw"
    
    client.post("/api/auth/register", json={"name": "Out", "email": email, "password": password})
    login_res = client.post("/api/auth/login", json={"email": email, "password": password})
    
    # Check that me works with cookies
    me_res = client.get("/api/auth/me", cookies=login_res.cookies)
    assert me_res.status_code == 200
    
    # Logout
    logout_res = client.post("/api/auth/logout", cookies=login_res.cookies)
    assert logout_res.status_code == 200
    
    # Try me again
    me_res2 = client.get("/api/auth/me", cookies=login_res.cookies)
    assert me_res2.status_code == 401
