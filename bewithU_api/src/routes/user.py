from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, current_user
from sqlalchemy import or_

from src.models import db
from src.models.user import User
from src.models.system import AuditLog

user_bp = Blueprint('users', __name__)

def get_client_info():
    """Get client IP and User-Agent."""
    ip_address = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
    user_agent = request.headers.get('User-Agent', '')
    return ip_address, user_agent

def require_admin():
    """Check if current user is admin."""
    if not current_user or not current_user.has_role('admin'):
        return jsonify({'error': 'Admin access required'}), 403
    return None

@user_bp.route('/', methods=['GET'])
@jwt_required()
def get_users():
    """Get list of users (admin only)."""
    admin_check = require_admin()
    if admin_check:
        return admin_check
    
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '').strip()
        role = request.args.get('role', '').strip()
        is_active = request.args.get('is_active', '').strip()
        
        # Build query
        query = User.query
        
        if search:
            query = query.filter(
                or_(
                    User.username.contains(search),
                    User.email.contains(search),
                    User.display_name.contains(search)
                )
            )
        
        if role:
            query = query.filter(User.role == role)
        
        if is_active:
            active_filter = is_active.lower() in ['true', '1', 'yes']
            query = query.filter(User.is_active == active_filter)
        
        # Paginate results
        users = query.order_by(User.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'users': [user.to_dict() for user in users.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': users.total,
                'pages': users.pages,
                'has_next': users.has_next,
                'has_prev': users.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get users', 'details': str(e)}), 500

@user_bp.route('/<user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    """Get specific user details."""
    try:
        # Users can view their own profile, admins can view any profile
        if current_user.id != user_id and not current_user.has_role('admin'):
            return jsonify({'error': 'Access denied'}), 403
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({'user': user.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get user', 'details': str(e)}), 500

@user_bp.route('/', methods=['POST'])
@jwt_required()
def create_user():
    """Create new user (admin only)."""
    admin_check = require_admin()
    if admin_check:
        return admin_check
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        username = data.get('username', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        display_name = data.get('display_name', '').strip()
        role = data.get('role', 'user')
        language = data.get('language', 'ja')
        
        # Validation
        if not username or not email or not password:
            return jsonify({'error': 'Username, email, and password are required'}), 400
        
        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400
        
        if role not in ['user', 'support', 'admin']:
            return jsonify({'error': 'Invalid role'}), 400
        
        if language not in ['ja', 'zh', 'en']:
            return jsonify({'error': 'Invalid language'}), 400
        
        # Check if username or email already exists
        existing_user = User.query.filter(
            or_(User.username == username, User.email == email)
        ).first()
        
        if existing_user:
            if existing_user.username == username:
                return jsonify({'error': 'Username already exists'}), 400
            else:
                return jsonify({'error': 'Email already exists'}), 400
        
        # Create user
        user = User.create_user(
            username=username,
            email=email,
            password=password,
            display_name=display_name or username,
            role=role,
            language=language
        )
        
        # Log user creation
        ip_address, user_agent = get_client_info()
        AuditLog.log_action(
            user_id=current_user.id,
            action='user_create',
            resource_type='user',
            resource_id=user.id,
            new_values=user.to_dict(),
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        return jsonify({'user': user.to_dict()}), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'User creation failed', 'details': str(e)}), 500

@user_bp.route('/<user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    """Update user (admin only or own profile)."""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check permissions
        is_own_profile = current_user.id == user_id
        is_admin = current_user.has_role('admin')
        
        if not is_own_profile and not is_admin:
            return jsonify({'error': 'Access denied'}), 403
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Store old values for audit
        old_values = user.to_dict()
        
        # Update allowed fields
        if 'display_name' in data:
            user.display_name = data['display_name'].strip()
        
        if 'email' in data:
            email = data['email'].strip().lower()
            # Check if email is already taken by another user
            existing_user = User.query.filter(
                User.email == email,
                User.id != user.id
            ).first()
            if existing_user:
                return jsonify({'error': 'Email already in use'}), 400
            user.email = email
        
        if 'language' in data:
            language = data['language']
            if language in ['ja', 'zh', 'en']:
                user.language = language
        
        # Admin-only fields
        if is_admin:
            if 'role' in data:
                role = data['role']
                if role in ['user', 'support', 'admin']:
                    user.role = role
            
            if 'is_active' in data:
                user.is_active = bool(data['is_active'])
        
        # Log user update
        ip_address, user_agent = get_client_info()
        AuditLog.log_action(
            user_id=current_user.id,
            action='user_update',
            resource_type='user',
            resource_id=user.id,
            old_values=old_values,
            new_values=user.to_dict(),
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        db.session.commit()
        
        return jsonify({'user': user.to_dict()}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'User update failed', 'details': str(e)}), 500

@user_bp.route('/<user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    """Delete user (admin only)."""
    admin_check = require_admin()
    if admin_check:
        return admin_check
    
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Prevent deleting own account
        if current_user.id == user_id:
            return jsonify({'error': 'Cannot delete your own account'}), 400
        
        # Store user data for audit
        user_data = user.to_dict()
        
        # Soft delete by deactivating
        user.is_active = False
        
        # Log user deletion
        ip_address, user_agent = get_client_info()
        AuditLog.log_action(
            user_id=current_user.id,
            action='user_delete',
            resource_type='user',
            resource_id=user.id,
            old_values=user_data,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        db.session.commit()
        
        return jsonify({'message': 'User deactivated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'User deletion failed', 'details': str(e)}), 500

@user_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_user_stats():
    """Get user statistics (admin only)."""
    admin_check = require_admin()
    if admin_check:
        return admin_check
    
    try:
        total_users = User.query.count()
        active_users = User.query.filter_by(is_active=True).count()
        admin_users = User.query.filter_by(role='admin', is_active=True).count()
        support_users = User.query.filter_by(role='support', is_active=True).count()
        regular_users = User.query.filter_by(role='user', is_active=True).count()
        
        # Recent registrations (last 30 days)
        from datetime import datetime, timezone, timedelta
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        recent_registrations = User.query.filter(
            User.created_at >= thirty_days_ago
        ).count()
        
        return jsonify({
            'total_users': total_users,
            'active_users': active_users,
            'inactive_users': total_users - active_users,
            'admin_users': admin_users,
            'support_users': support_users,
            'regular_users': regular_users,
            'recent_registrations': recent_registrations
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get user stats', 'details': str(e)}), 500
