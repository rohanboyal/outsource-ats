"""
Client management endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import List, Optional

from app.db.session import get_db
from app.models.user import User
from app.models.client import Client, ClientContact, ClientStatus
from app.models.pitch import Pitch
from app.models.job_description import JobDescription, JDStatus
from app.models.application import Application
from app.schemas.client import (
    ClientCreate,
    ClientUpdate,
    ClientResponse,
    ClientListResponse,
    ClientDetailResponse,
    ClientContactCreate,
    ClientContactUpdate,
    ClientContactResponse
)
from app.core.permissions import Permission
from app.api.deps import get_current_user, PermissionChecker


router = APIRouter()


# ============================================================================
# CLIENT ENDPOINTS
# ============================================================================

@router.post("", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
async def create_client(
    client_data: ClientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.CREATE_CLIENT))
):
    """
    Create a new client.
    
    Permissions required: CREATE_CLIENT
    """
    # Verify account manager exists if provided
    if client_data.account_manager_id:
        account_manager = db.query(User).filter(User.id == client_data.account_manager_id).first()
        if not account_manager:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Account manager with ID {client_data.account_manager_id} not found"
            )
    
    # Create client
    new_client = Client(
        company_name=client_data.company_name,
        industry=client_data.industry,
        website=client_data.website,
        address=client_data.address,
        status=client_data.status,
        account_manager_id=client_data.account_manager_id,
        default_sla_days=client_data.default_sla_days,
        created_by=current_user.id
    )
    
    db.add(new_client)
    db.flush()  # Flush to get the client ID
    
    # Create contacts if provided
    if client_data.contacts:
        for contact_data in client_data.contacts:
            contact = ClientContact(
                client_id=new_client.id,
                name=contact_data.name,
                email=contact_data.email,
                phone=contact_data.phone,
                designation=contact_data.designation,
                is_primary=contact_data.is_primary
            )
            db.add(contact)
    
    db.commit()
    db.refresh(new_client)
    
    return new_client


@router.get("", response_model=ClientListResponse)
async def list_clients(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search by company name or industry"),
    status: Optional[ClientStatus] = Query(None, description="Filter by status"),
    account_manager_id: Optional[int] = Query(None, description="Filter by account manager"),
    include_deleted: bool = Query(False, description="Include soft-deleted clients"),
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.VIEW_CLIENT))
):
    """
    List all clients with pagination and filters.
    
    Permissions required: VIEW_CLIENT
    """
    # Base query
    query = db.query(Client)
    
    # Filter out deleted clients unless requested
    if not include_deleted:
        query = query.filter(Client.deleted_at.is_(None))
    
    # Apply filters
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Client.company_name.ilike(search_term),
                Client.industry.ilike(search_term)
            )
        )
    
    if status:
        query = query.filter(Client.status == status)
    
    if account_manager_id:
        query = query.filter(Client.account_manager_id == account_manager_id)
    
    # Get total count
    total = query.count()
    
    # Calculate pagination
    pages = (total + page_size - 1) // page_size
    offset = (page - 1) * page_size
    
    # Get paginated results
    clients = query.offset(offset).limit(page_size).all()
    
    return ClientListResponse(
        clients=clients,
        total=total,
        page=page,
        page_size=page_size,
        pages=pages
    )


@router.get("/{client_id}", response_model=ClientDetailResponse)
async def get_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.VIEW_CLIENT))
):
    """
    Get client details by ID with statistics.
    
    Permissions required: VIEW_CLIENT
    """
    client = db.query(Client).filter(Client.id == client_id).first()
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Client with ID {client_id} not found"
        )
    
    # Get statistics
    total_pitches = db.query(func.count(Pitch.id)).filter(Pitch.client_id == client_id).scalar() or 0
    total_jds = db.query(func.count(JobDescription.id)).filter(JobDescription.client_id == client_id).scalar() or 0
    active_jds = db.query(func.count(JobDescription.id)).filter(
        JobDescription.client_id == client_id,
        JobDescription.status == JDStatus.OPEN
    ).scalar() or 0
    
    # Get total applications for this client
    total_applications = db.query(func.count(Application.id)).join(
        JobDescription, Application.jd_id == JobDescription.id
    ).filter(JobDescription.client_id == client_id).scalar() or 0
    
    # Convert to response with statistics
    response = ClientDetailResponse(
        **client.__dict__,
        total_pitches=total_pitches,
        total_jds=total_jds,
        active_jds=active_jds,
        total_applications=total_applications
    )
    
    return response


@router.put("/{client_id}", response_model=ClientResponse)
async def update_client(
    client_id: int,
    client_data: ClientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.UPDATE_CLIENT))
):
    """
    Update client information.
    
    Permissions required: UPDATE_CLIENT
    """
    client = db.query(Client).filter(Client.id == client_id).first()
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Client with ID {client_id} not found"
        )
    
    # Check if client is deleted
    if client.deleted_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update a deleted client"
        )
    
    # Verify account manager exists if being updated
    if client_data.account_manager_id is not None:
        if client_data.account_manager_id:  # If not setting to None
            account_manager = db.query(User).filter(User.id == client_data.account_manager_id).first()
            if not account_manager:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Account manager with ID {client_data.account_manager_id} not found"
                )
    
    # Update fields
    update_data = client_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(client, field, value)
    
    db.commit()
    db.refresh(client)
    
    return client


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(
    client_id: int,
    hard_delete: bool = Query(False, description="Permanently delete (admin only)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.DELETE_CLIENT))
):
    """
    Delete client (soft delete by default, hard delete if specified).
    
    Permissions required: DELETE_CLIENT
    
    Soft delete: Sets deleted_at timestamp
    Hard delete: Permanently removes from database (admin only)
    """
    client = db.query(Client).filter(Client.id == client_id).first()
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Client with ID {client_id} not found"
        )
    
    if hard_delete:
        # Hard delete - requires admin
        if not current_user.is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Hard delete requires admin privileges"
            )
        db.delete(client)
    else:
        # Soft delete
        from datetime import datetime
        client.deleted_at = datetime.utcnow()
    
    db.commit()
    
    return None


# ============================================================================
# CLIENT CONTACT ENDPOINTS
# ============================================================================

@router.post("/{client_id}/contacts", response_model=ClientContactResponse, status_code=status.HTTP_201_CREATED)
async def add_client_contact(
    client_id: int,
    contact_data: ClientContactCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.UPDATE_CLIENT))
):
    """
    Add a contact person to a client.
    
    Permissions required: UPDATE_CLIENT
    """
    # Verify client exists
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Client with ID {client_id} not found"
        )
    
    # If this is set as primary, unset other primary contacts
    if contact_data.is_primary:
        db.query(ClientContact).filter(
            ClientContact.client_id == client_id,
            ClientContact.is_primary == True
        ).update({"is_primary": False})
    
    # Create contact
    contact = ClientContact(
        client_id=client_id,
        name=contact_data.name,
        email=contact_data.email,
        phone=contact_data.phone,
        designation=contact_data.designation,
        is_primary=contact_data.is_primary
    )
    
    db.add(contact)
    db.commit()
    db.refresh(contact)
    
    return contact


@router.get("/{client_id}/contacts", response_model=List[ClientContactResponse])
async def list_client_contacts(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.VIEW_CLIENT))
):
    """
    List all contacts for a client.
    
    Permissions required: VIEW_CLIENT
    """
    # Verify client exists
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Client with ID {client_id} not found"
        )
    
    contacts = db.query(ClientContact).filter(ClientContact.client_id == client_id).all()
    
    return contacts


@router.put("/{client_id}/contacts/{contact_id}", response_model=ClientContactResponse)
async def update_client_contact(
    client_id: int,
    contact_id: int,
    contact_data: ClientContactUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.UPDATE_CLIENT))
):
    """
    Update a client contact.
    
    Permissions required: UPDATE_CLIENT
    """
    contact = db.query(ClientContact).filter(
        ClientContact.id == contact_id,
        ClientContact.client_id == client_id
    ).first()
    
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Contact with ID {contact_id} not found for client {client_id}"
        )
    
    # If setting as primary, unset other primary contacts
    if contact_data.is_primary:
        db.query(ClientContact).filter(
            ClientContact.client_id == client_id,
            ClientContact.id != contact_id,
            ClientContact.is_primary == True
        ).update({"is_primary": False})
    
    # Update fields
    update_data = contact_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(contact, field, value)
    
    db.commit()
    db.refresh(contact)
    
    return contact


@router.delete("/{client_id}/contacts/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client_contact(
    client_id: int,
    contact_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.UPDATE_CLIENT))
):
    """
    Delete a client contact.
    
    Permissions required: UPDATE_CLIENT
    """
    contact = db.query(ClientContact).filter(
        ClientContact.id == contact_id,
        ClientContact.client_id == client_id
    ).first()
    
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Contact with ID {contact_id} not found for client {client_id}"
        )
    
    db.delete(contact)
    db.commit()
    
    return None
