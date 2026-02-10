"""
Role-Based Access Control (RBAC) permissions system.
"""
from enum import Enum
from typing import List, Set
from fastapi import HTTPException, status


class UserRole(str, Enum):
    """User roles in the system."""
    ADMIN = "admin"
    RECRUITER = "recruiter"
    ACCOUNT_MANAGER = "account_manager"
    BD_SALES = "bd_sales"
    FINANCE = "finance"
    CLIENT = "client"


class Permission(str, Enum):
    """System permissions."""
    # User management
    CREATE_USER = "create_user"
    VIEW_USER = "view_user"
    UPDATE_USER = "update_user"
    DELETE_USER = "delete_user"
    
    # Client management
    CREATE_CLIENT = "create_client"
    VIEW_CLIENT = "view_client"
    UPDATE_CLIENT = "update_client"
    DELETE_CLIENT = "delete_client"
    VIEW_ALL_CLIENTS = "view_all_clients"
    
    # Pitch management
    CREATE_PITCH = "create_pitch"
    VIEW_PITCH = "view_pitch"
    UPDATE_PITCH = "update_pitch"
    DELETE_PITCH = "delete_pitch"
    CONVERT_PITCH = "convert_pitch"
    
    # Job Description management
    CREATE_JD = "create_jd"
    VIEW_JD = "view_jd"
    UPDATE_JD = "update_jd"
    DELETE_JD = "delete_jd"
    ASSIGN_JD = "assign_jd"
    VIEW_ALL_JD = "view_all_jd"
    
    # Candidate management
    CREATE_CANDIDATE = "create_candidate"
    VIEW_CANDIDATE = "view_candidate"
    UPDATE_CANDIDATE = "update_candidate"
    DELETE_CANDIDATE = "delete_candidate"
    UPLOAD_RESUME = "upload_resume"
    
    # Application management
    CREATE_APPLICATION = "create_application"
    VIEW_APPLICATION = "view_application"
    UPDATE_APPLICATION = "update_application"
    DELETE_APPLICATION = "delete_application"
    SUBMIT_APPLICATION = "submit_application"
    VIEW_SUBMITTED_ONLY = "view_submitted_only"
    
    # Interview management
    CREATE_INTERVIEW = "create_interview"
    VIEW_INTERVIEW = "view_interview"
    UPDATE_INTERVIEW = "update_interview"
    DELETE_INTERVIEW = "delete_interview"
    SUBMIT_FEEDBACK = "submit_feedback"
    
    # Offer management
    CREATE_OFFER = "create_offer"
    VIEW_OFFER = "view_offer"
    UPDATE_OFFER = "update_offer"
    DELETE_OFFER = "delete_offer"
    APPROVE_OFFER = "approve_offer"
    
    # Joining management
    CREATE_JOINING = "create_joining"
    VIEW_JOINING = "view_joining"
    UPDATE_JOINING = "update_joining"
    
    # Contract management
    CREATE_CONTRACT = "create_contract"
    VIEW_CONTRACT = "view_contract"
    UPDATE_CONTRACT = "update_contract"
    DELETE_CONTRACT = "delete_contract"
    
    # Invoice management
    CREATE_INVOICE = "create_invoice"
    VIEW_INVOICE = "view_invoice"
    UPDATE_INVOICE = "update_invoice"
    DELETE_INVOICE = "delete_invoice"
    MARK_PAID = "mark_paid"
    
    # Reports and analytics
    VIEW_REPORTS = "view_reports"
    VIEW_DASHBOARD = "view_dashboard"
    EXPORT_DATA = "export_data"


# Role-Permission mapping
ROLE_PERMISSIONS: dict[UserRole, Set[Permission]] = {
    UserRole.ADMIN: {
        # Admins have all permissions
        *Permission.__members__.values()
    },
    
    UserRole.RECRUITER: {
        # Client (view only assigned)
        Permission.VIEW_CLIENT,
        
        # JD (view and update assigned)
        Permission.VIEW_JD,
        Permission.UPDATE_JD,
        
        # Candidate (full access)
        Permission.CREATE_CANDIDATE,
        Permission.VIEW_CANDIDATE,
        Permission.UPDATE_CANDIDATE,
        Permission.UPLOAD_RESUME,
        
        # Application (full access)
        Permission.CREATE_APPLICATION,
        Permission.VIEW_APPLICATION,
        Permission.UPDATE_APPLICATION,
        Permission.SUBMIT_APPLICATION,
        
        # Interview (full access)
        Permission.CREATE_INTERVIEW,
        Permission.VIEW_INTERVIEW,
        Permission.UPDATE_INTERVIEW,
        Permission.SUBMIT_FEEDBACK,
        
        # Offer (view and create)
        Permission.CREATE_OFFER,
        Permission.VIEW_OFFER,
        
        # Joining
        Permission.CREATE_JOINING,
        Permission.VIEW_JOINING,
        Permission.UPDATE_JOINING,
        
        # Dashboard
        Permission.VIEW_DASHBOARD,
    },
    
    UserRole.ACCOUNT_MANAGER: {
        # Client (full access)
        Permission.CREATE_CLIENT,
        Permission.VIEW_CLIENT,
        Permission.UPDATE_CLIENT,
        Permission.VIEW_ALL_CLIENTS,
        
        # Pitch (full access)
        Permission.CREATE_PITCH,
        Permission.VIEW_PITCH,
        Permission.UPDATE_PITCH,
        Permission.CONVERT_PITCH,
        
        # JD (full access)
        Permission.CREATE_JD,
        Permission.VIEW_JD,
        Permission.UPDATE_JD,
        Permission.ASSIGN_JD,
        Permission.VIEW_ALL_JD,
        
        # Applications (view only)
        Permission.VIEW_APPLICATION,
        
        # Interviews (view only)
        Permission.VIEW_INTERVIEW,
        
        # Offers (full access)
        Permission.CREATE_OFFER,
        Permission.VIEW_OFFER,
        Permission.UPDATE_OFFER,
        Permission.APPROVE_OFFER,
        
        # Joining
        Permission.VIEW_JOINING,
        
        # Reports
        Permission.VIEW_REPORTS,
        Permission.VIEW_DASHBOARD,
        Permission.EXPORT_DATA,
    },
    
    UserRole.BD_SALES: {
        # Client (full access)
        Permission.CREATE_CLIENT,
        Permission.VIEW_CLIENT,
        Permission.UPDATE_CLIENT,
        Permission.VIEW_ALL_CLIENTS,
        
        # Pitch (full access)
        Permission.CREATE_PITCH,
        Permission.VIEW_PITCH,
        Permission.UPDATE_PITCH,
        Permission.CONVERT_PITCH,
        
        # JD (view only)
        Permission.VIEW_JD,
        
        # Dashboard
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_REPORTS,
    },
    
    UserRole.FINANCE: {
        # Contract (full access)
        Permission.CREATE_CONTRACT,
        Permission.VIEW_CONTRACT,
        Permission.UPDATE_CONTRACT,
        
        # Invoice (full access)
        Permission.CREATE_INVOICE,
        Permission.VIEW_INVOICE,
        Permission.UPDATE_INVOICE,
        Permission.MARK_PAID,
        
        # Client (view only)
        Permission.VIEW_CLIENT,
        
        # Joining (view only)
        Permission.VIEW_JOINING,
        
        # Reports
        Permission.VIEW_REPORTS,
        Permission.EXPORT_DATA,
    },
    
    UserRole.CLIENT: {
        # View submitted candidates only
        Permission.VIEW_SUBMITTED_ONLY,
        
        # View interviews for their candidates
        Permission.VIEW_INTERVIEW,
        Permission.SUBMIT_FEEDBACK,
    },
}


def get_user_permissions(role: UserRole) -> Set[Permission]:
    """
    Get all permissions for a given role.
    
    Args:
        role: User role
        
    Returns:
        Set of permissions for the role
    """
    return ROLE_PERMISSIONS.get(role, set())


def has_permission(user_role: UserRole, required_permission: Permission) -> bool:
    """
    Check if a user role has a specific permission.
    
    Args:
        user_role: User's role
        required_permission: Permission to check
        
    Returns:
        True if user has permission, False otherwise
    """
    permissions = get_user_permissions(user_role)
    return required_permission in permissions


def require_permission(user_role: UserRole, required_permission: Permission) -> None:
    """
    Require a specific permission, raise exception if not granted.
    
    Args:
        user_role: User's role
        required_permission: Required permission
        
    Raises:
        HTTPException: If user doesn't have required permission
    """
    if not has_permission(user_role, required_permission):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permission denied. Required permission: {required_permission.value}"
        )


def require_any_permission(user_role: UserRole, required_permissions: List[Permission]) -> None:
    """
    Require at least one of the specified permissions.
    
    Args:
        user_role: User's role
        required_permissions: List of permissions (any one required)
        
    Raises:
        HTTPException: If user doesn't have any of the required permissions
    """
    user_permissions = get_user_permissions(user_role)
    if not any(perm in user_permissions for perm in required_permissions):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied. Insufficient privileges."
        )


def require_all_permissions(user_role: UserRole, required_permissions: List[Permission]) -> None:
    """
    Require all of the specified permissions.
    
    Args:
        user_role: User's role
        required_permissions: List of permissions (all required)
        
    Raises:
        HTTPException: If user doesn't have all required permissions
    """
    user_permissions = get_user_permissions(user_role)
    if not all(perm in user_permissions for perm in required_permissions):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied. Insufficient privileges."
        )
