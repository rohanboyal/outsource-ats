"""
Permission definitions for RBAC system.
"""
from enum import Enum


class Permission(str, Enum):
    """
    Granular permissions for the ATS system.
    Each permission represents a specific action.
    """
    # ============================================================================
    # USER MANAGEMENT
    # ============================================================================
    CREATE_USER = "create_user"
    VIEW_USER = "view_user"
    UPDATE_USER = "update_user"
    DELETE_USER = "delete_user"
    MANAGE_ROLES = "manage_roles"
    
    # ============================================================================
    # CLIENT MANAGEMENT
    # ============================================================================
    CREATE_CLIENT = "create_client"
    VIEW_CLIENT = "view_client"
    UPDATE_CLIENT = "update_client"
    DELETE_CLIENT = "delete_client"
    
    # ============================================================================
    # PITCH MANAGEMENT
    # ============================================================================
    CREATE_PITCH = "create_pitch"
    VIEW_PITCH = "view_pitch"
    UPDATE_PITCH = "update_pitch"
    DELETE_PITCH = "delete_pitch"
    SEND_PITCH = "send_pitch"
    APPROVE_PITCH = "approve_pitch"
    
    # ============================================================================
    # JOB DESCRIPTION MANAGEMENT
    # ============================================================================
    CREATE_JD = "create_jd"
    VIEW_JD = "view_jd"
    UPDATE_JD = "update_jd"
    DELETE_JD = "delete_jd"
    ASSIGN_JD = "assign_jd"
    
    # ============================================================================
    # CANDIDATE MANAGEMENT
    # ============================================================================
    CREATE_CANDIDATE = "create_candidate"
    VIEW_CANDIDATE = "view_candidate"
    UPDATE_CANDIDATE = "update_candidate"
    DELETE_CANDIDATE = "delete_candidate"
    UPLOAD_RESUME = "upload_resume"
    
    # ============================================================================
    # APPLICATION MANAGEMENT
    # ============================================================================
    CREATE_APPLICATION = "create_application"
    VIEW_APPLICATION = "view_application"
    UPDATE_APPLICATION = "update_application"
    DELETE_APPLICATION = "delete_application"
    SUBMIT_APPLICATION = "submit_application"
    
    # ============================================================================
    # INTERVIEW MANAGEMENT
    # ============================================================================
    CREATE_INTERVIEW = "create_interview"
    VIEW_INTERVIEW = "view_interview"
    UPDATE_INTERVIEW = "update_interview"
    DELETE_INTERVIEW = "delete_interview"
    SUBMIT_FEEDBACK = "submit_feedback"
    
    # ============================================================================
    # OFFER MANAGEMENT
    # ============================================================================
    CREATE_OFFER = "create_offer"
    VIEW_OFFER = "view_offer"
    UPDATE_OFFER = "update_offer"
    DELETE_OFFER = "delete_offer"
    SEND_OFFER = "send_offer"
    APPROVE_OFFER = "approve_offer"
    
    # ============================================================================
    # JOINING MANAGEMENT
    # ============================================================================
    CREATE_JOINING = "create_joining"
    VIEW_JOINING = "view_joining"
    UPDATE_JOINING = "update_joining"
    DELETE_JOINING = "delete_joining"
    
    # ============================================================================
    # REPORTS & ANALYTICS
    # ============================================================================
    VIEW_REPORTS = "view_reports"
    EXPORT_DATA = "export_data"
    VIEW_ANALYTICS = "view_analytics"


class UserRole(str, Enum):
    """User roles in the system."""
    ADMIN = "admin"
    RECRUITER = "recruiter"
    ACCOUNT_MANAGER = "account_manager"
    BD_SALES = "bd_sales"
    FINANCE = "finance"
    CLIENT = "client"


# Role-based permission mappings
ROLE_PERMISSIONS = {
    UserRole.ADMIN: [
        # Admin has all permissions
        Permission.CREATE_USER,
        Permission.VIEW_USER,
        Permission.UPDATE_USER,
        Permission.DELETE_USER,
        Permission.MANAGE_ROLES,
        
        Permission.CREATE_CLIENT,
        Permission.VIEW_CLIENT,
        Permission.UPDATE_CLIENT,
        Permission.DELETE_CLIENT,
        
        Permission.CREATE_PITCH,
        Permission.VIEW_PITCH,
        Permission.UPDATE_PITCH,
        Permission.DELETE_PITCH,
        Permission.SEND_PITCH,
        Permission.APPROVE_PITCH,
        
        Permission.CREATE_JD,
        Permission.VIEW_JD,
        Permission.UPDATE_JD,
        Permission.DELETE_JD,
        Permission.ASSIGN_JD,
        
        Permission.CREATE_CANDIDATE,
        Permission.VIEW_CANDIDATE,
        Permission.UPDATE_CANDIDATE,
        Permission.DELETE_CANDIDATE,
        Permission.UPLOAD_RESUME,
        
        Permission.CREATE_APPLICATION,
        Permission.VIEW_APPLICATION,
        Permission.UPDATE_APPLICATION,
        Permission.DELETE_APPLICATION,
        Permission.SUBMIT_APPLICATION,
        
        Permission.CREATE_INTERVIEW,
        Permission.VIEW_INTERVIEW,
        Permission.UPDATE_INTERVIEW,
        Permission.DELETE_INTERVIEW,
        Permission.SUBMIT_FEEDBACK,
        
        Permission.CREATE_OFFER,
        Permission.VIEW_OFFER,
        Permission.UPDATE_OFFER,
        Permission.DELETE_OFFER,
        Permission.SEND_OFFER,
        Permission.APPROVE_OFFER,
        
        Permission.CREATE_JOINING,
        Permission.VIEW_JOINING,
        Permission.UPDATE_JOINING,
        Permission.DELETE_JOINING,
        
        Permission.VIEW_REPORTS,
        Permission.EXPORT_DATA,
        Permission.VIEW_ANALYTICS,
    ],
    
    UserRole.RECRUITER: [
        # Recruiter: Focus on candidates and applications
        Permission.VIEW_CLIENT,
        
        Permission.VIEW_PITCH,
        
        Permission.VIEW_JD,
        Permission.UPDATE_JD,
        
        Permission.CREATE_CANDIDATE,
        Permission.VIEW_CANDIDATE,
        Permission.UPDATE_CANDIDATE,
        Permission.UPLOAD_RESUME,
        
        Permission.CREATE_APPLICATION,
        Permission.VIEW_APPLICATION,
        Permission.UPDATE_APPLICATION,
        Permission.SUBMIT_APPLICATION,
        
        Permission.CREATE_INTERVIEW,
        Permission.VIEW_INTERVIEW,
        Permission.UPDATE_INTERVIEW,
        Permission.SUBMIT_FEEDBACK,
        
        Permission.VIEW_OFFER,
        
        Permission.VIEW_JOINING,
        
        Permission.VIEW_REPORTS,
    ],
    
    UserRole.ACCOUNT_MANAGER: [
        # Account Manager: Client relationships and JDs
        Permission.CREATE_CLIENT,
        Permission.VIEW_CLIENT,
        Permission.UPDATE_CLIENT,
        
        Permission.CREATE_PITCH,
        Permission.VIEW_PITCH,
        Permission.UPDATE_PITCH,
        Permission.SEND_PITCH,
        
        Permission.CREATE_JD,
        Permission.VIEW_JD,
        Permission.UPDATE_JD,
        Permission.ASSIGN_JD,
        
        Permission.VIEW_CANDIDATE,
        
        Permission.VIEW_APPLICATION,
        Permission.SUBMIT_APPLICATION,
        
        Permission.VIEW_INTERVIEW,
        
        Permission.VIEW_OFFER,
        Permission.CREATE_OFFER,
        Permission.UPDATE_OFFER,
        Permission.SEND_OFFER,
        
        Permission.VIEW_JOINING,
        
        Permission.VIEW_REPORTS,
        Permission.VIEW_ANALYTICS,
    ],
    
    UserRole.BD_SALES: [
        # BD/Sales: Business development and pitches
        Permission.VIEW_CLIENT,
        Permission.CREATE_CLIENT,
        
        Permission.CREATE_PITCH,
        Permission.VIEW_PITCH,
        Permission.UPDATE_PITCH,
        Permission.SEND_PITCH,
        
        Permission.VIEW_JD,
        
        Permission.VIEW_CANDIDATE,
        
        Permission.VIEW_APPLICATION,
        
        Permission.VIEW_REPORTS,
    ],
    
    UserRole.FINANCE: [
        # Finance: View access for billing/invoicing
        Permission.VIEW_CLIENT,
        
        Permission.VIEW_PITCH,
        
        Permission.VIEW_JD,
        
        Permission.VIEW_CANDIDATE,
        
        Permission.VIEW_APPLICATION,
        
        Permission.VIEW_OFFER,
        
        Permission.VIEW_JOINING,
        
        Permission.VIEW_REPORTS,
        Permission.EXPORT_DATA,
    ],
    
    UserRole.CLIENT: [
        # Client: Limited view access
        Permission.VIEW_JD,
        
        Permission.VIEW_CANDIDATE,
        
        Permission.VIEW_APPLICATION,
        
        Permission.VIEW_INTERVIEW,
    ],
}


def get_user_permissions(role: UserRole) -> list[Permission]:
    """
    Get all permissions for a given role.
    
    Args:
        role: User role
        
    Returns:
        List of permissions
    """
    return ROLE_PERMISSIONS.get(role, [])


def has_permission(user_role: UserRole, required_permission: Permission) -> bool:
    """
    Check if a role has a specific permission.
    
    Args:
        user_role: User's role
        required_permission: Required permission
        
    Returns:
        True if role has permission, False otherwise
    """
    user_permissions = get_user_permissions(user_role)
    return required_permission in user_permissions