from sqlalchemy import Column, Integer, String, DateTime, Float, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from geoalchemy2 import Geography

Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True)
    hashed_password = Column(String(255))
    created_at = Column(DateTime)


class ArgoFloat(Base):
    __tablename__ = "argo_floats"
    id = Column(Integer, primary_key=True, index=True)
    float_id = Column(String(50), unique=True, index=True)
    platform_number = Column(String(50))
    cycle_number = Column(Integer)
    date = Column(DateTime)
    latitude = Column(Float)
    longitude = Column(Float)
    location = Column(Geography(geometry_type='POINT', srid=4326))  # PostGIS point
    depth = Column(Float)
    temperature = Column(Float)
    salinity = Column(Float)
    pressure = Column(Float)

    # Relationship to data points
    data_points = relationship("FloatDataPoint", back_populates="float")


class FloatDataPoint(Base):
    __tablename__ = "float_data_points"
    id = Column(Integer, primary_key=True, index=True)
    float_id = Column(Integer, ForeignKey('argo_floats.id'))
    date = Column(DateTime)
    latitude = Column(Float)
    longitude = Column(Float)
    location = Column(Geography(geometry_type='POINT', srid=4326))
    temperature = Column(Float)
    salinity = Column(Float)
    depth = Column(Float)

    # Relationship
    float = relationship("ArgoFloat", back_populates="data_points")


# Pydantic models for API validation
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class UserBase(BaseModel):
    email: str = Field(..., example="user@example.com")


class UserCreate(UserBase):
    password: str


class User(UserBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True


class FloatData(BaseModel):
    float_id: str = Field(..., example="12345")
    platform_number: Optional[str]
    cycle_number: Optional[int]
    date: datetime
    latitude: float
    longitude: float
    depth: float
    temperature: float
    salinity: float
    pressure: Optional[float]

    class Config:
        orm_mode = True


class FloatSummary(BaseModel):
    id: int
    float_id: str
    latitude: float
    longitude: float
    temperature: float
    salinity: float
    date: datetime


class ChatQuery(BaseModel):
    query: str = Field(..., min_length=1, max_length=500, example="Show me temperature data for float 12345")


class ChatResponse(BaseModel):
    query: str
    response: str
    timestamp: datetime


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None