"""
Database models package.
Import all models here to ensure they are registered with SQLAlchemy.
"""
from app.models.user import User
from app.models.client import Client, ClientContact
from app.models.pitch import Pitch
from app.models.job_description import JobDescription
from app.models.candidate import Candidate
from app.models.application import Application, ApplicationStatusHistory
from app.models.interview import Interview
from app.models.offer import Offer
from app.models.joining import Joining

__all__ = [
    "User",
    "Client",
    "ClientContact",
    "Pitch",
    "JobDescription",
    "Candidate",
    "Application",
    "ApplicationStatusHistory",
    "Interview",
    "Offer",
    "Joining",
]
