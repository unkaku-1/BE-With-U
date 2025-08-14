from datetime import datetime, timezone, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, create_refresh_token, jwt_required, 
    get_jwt_identity, get_jwt, current_user
)
from werkzeug.security import generate_password_hash
import hashlib

from src.models import db
from src.models.user import User, UserSession
from src.models.system import AuditLog

auth_bp = Blueprint('auth', __name__)

def get_client_info():
    """Get client IP and User-Agent."""
    ip_address = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
    user_agent = request.headers.get('User-Agent', '')
    return ip_address, user_agent

def hash_token(token):
    """Hash token for storage."""
    return hashlib.sha256(token.encode()).hexdigest()

@auth_bp.route('/login', methods=['POST'])
def login():
    """User login endpoint."""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        username = data.get('username', '').strip()
        password = data.get('password', '')
        remember_me = data.get('rememberMe', False)
        
        if not username or not password:
            return jsonify({'error': 'Username and password are required'}), 400
        
        # Find user by username or email
        user = User.query.filter(
            (User.username == username) | (User.email == username)
        ).first()
        
        if not user or not user.check_password(password):
            # Log failed login attempt
            ip_address, user_agent = get_client_info()
            AuditLog.log_action(
                user_id=user.id if user else None,
                action='login_failed',
                resource_type='user',
                resource_id=user.id if user else None,
                ip_address=ip_address,
                user_agent=user_agent
            )
            return jsonify({'error': 'Invalid username or password'}), 401
        
        if not user.is_active:
            return jsonify({'error': 'Account is disabled'}), 401
        
        # Create tokens
        access_token = create_access_token(
            identity=user,
            expires_delta=timedelta(hours=24 if remember_me else 1)
        )
        refresh_token = create_refresh_token(
            identity=user,
            expires_delta=timedelta(days=30 if remember_me else 7)
        )
        
        # Create session record
        ip_address, user_agent = get_client_info()
        expires_at = datetime.now(timezone.utc) + timedelta(hours=24 if remember_me else 1)
        
        session = UserSession(
            user_id=user.id,
            token_hash=hash_token(access_token),
            refresh_token_hash=hash_token(refresh_token),
            expires_at=expires_at,
            user_agent=user_agent,
            ip_address=ip_address
        )
        db.session.add(session)
        
        # Update user last login
        user.update_last_login()
        
        # Log successful login
        AuditLog.log_action(
            user_id=user.id,
            action='login_success',
            resource_type='user',
            resource_id=user.id,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        db.session.commit()
        
        return jsonify({
            'user': user.to_dict(),
            'token': access_token,
            'refreshToken': refresh_token,
            'expiresAt': expires_at.isoformat()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Login failed', 'details': str(e)}), 500

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """User logout endpoint."""
    try:
        jti = get_jwt()['jti']
        user_id = get_jwt_identity()
        
        # Remove session from database
        session = UserSession.query.filter_by(token_hash=jti).first()
        if session:
            db.session.delete(session)
        
        # Log logout
        ip_address, user_agent = get_client_info()
        AuditLog.log_action(
            user_id=user_id,
            action='logout',
            resource_type='user',
            resource_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        db.session.commit()
        
        return jsonify({'message': 'Successfully logged out'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Logout failed', 'details': str(e)}), 500

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or not user.is_active:
            return jsonify({'error': 'User not found or inactive'}), 401
        
        # Create new access token
        access_token = create_access_token(identity=user)
        expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
        
        # Update session
        refresh_jti = get_jwt()['jti']
        session = UserSession.query.filter_by(refresh_token_hash=refresh_jti).first()
        if session:
            session.token_hash = hash_token(access_token)
            session.expires_at = expires_at
            session.update_last_used()
        
        db.session.commit()
        
        return jsonify({
            'token': access_token,
            'expiresAt': expires_at.isoformat()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Token refresh failed', 'details': str(e)}), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user information."""
    try:
        user = current_user
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Update session last used
        jti = get_jwt()['jti']
        session = UserSession.query.filter_by(token_hash=jti).first()
        if session:
            session.update_last_used()
        
        return jsonify({'user': user.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get user info', 'details': str(e)}), 500

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update user profile."""
    try:
        user = current_user
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Store old values for audit
        old_values = {
            'display_name': user.display_name,
            'email': user.email,
            'language': user.language
        }
        
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
        
        # Log profile update
        new_values = {
            'display_name': user.display_name,
            'email': user.email,
            'language': user.language
        }
        
        ip_address, user_agent = get_client_info()
        AuditLog.log_action(
            user_id=user.id,
            action='profile_update',
            resource_type='user',
            resource_id=user.id,
            old_values=old_values,
            new_values=new_values,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        db.session.commit()
        
        return jsonify({'user': user.to_dict()}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Profile update failed', 'details': str(e)}), 500

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change user password."""
    try:
        user = current_user
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        current_password = data.get('currentPassword', '')
        new_password = data.get('newPassword', '')
        
        if not current_password or not new_password:
            return jsonify({'error': 'Current and new passwords are required'}), 400
        
        if not user.check_password(current_password):
            return jsonify({'error': 'Current password is incorrect'}), 400
        
        if len(new_password) < 6:
            return jsonify({'error': 'New password must be at least 6 characters'}), 400
        
        # Update password
        user.set_password(new_password)
        
        # Invalidate all existing sessions except current one
        jti = get_jwt()['jti']
        UserSession.query.filter(
            UserSession.user_id == user.id,
            UserSession.token_hash != jti
        ).delete()
        
        # Log password change
        ip_address, user_agent = get_client_info()
        AuditLog.log_action(
            user_id=user.id,
            action='password_change',
            resource_type='user',
            resource_id=user.id,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        db.session.commit()
        
        return jsonify({'message': 'Password changed successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Password change failed', 'details': str(e)}), 500

@auth_bp.route('/sessions', methods=['GET'])
@jwt_required()
def get_user_sessions():
    """Get user's active sessions."""
    try:
        user = current_user
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        sessions = UserSession.query.filter_by(user_id=user.id).order_by(
            UserSession.last_used_at.desc()
        ).all()
        
        current_jti = get_jwt()['jti']
        
        session_list = []
        for session in sessions:
            session_data = session.to_dict()
            session_data['is_current'] = session.token_hash == current_jti
            session_data['is_expired'] = session.is_expired()
            session_list.append(session_data)
        
        return jsonify({'sessions': session_list}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get sessions', 'details': str(e)}), 500

@auth_bp.route('/sessions/<session_id>', methods=['DELETE'])
@jwt_required()
def revoke_session(session_id):
    """Revoke a specific session."""
    try:
        user = current_user
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        session = UserSession.query.filter_by(
            id=session_id,
            user_id=user.id
        ).first()
        
        if not session:
            return jsonify({'error': 'Session not found'}), 404
        
        # Don't allow revoking current session
        current_jti = get_jwt()['jti']
        if session.token_hash == current_jti:
            return jsonify({'error': 'Cannot revoke current session'}), 400
        
        db.session.delete(session)
        
        # Log session revocation
        ip_address, user_agent = get_client_info()
        AuditLog.log_action(
            user_id=user.id,
            action='session_revoke',
            resource_type='user_session',
            resource_id=session_id,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        db.session.commit()
        
        return jsonify({'message': 'Session revoked successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Session revocation failed', 'details': str(e)}), 500

