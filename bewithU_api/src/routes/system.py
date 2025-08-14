from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, current_user
from datetime import datetime, timezone, timedelta

from src.models import db
from src.models.system import SystemSetting, AuditLog, SystemHealth, Notification
from src.models.user import User
from src.models.ticket import Ticket
from src.models.knowledge import KnowledgeArticle
from src.models.chat import ChatConversation

system_bp = Blueprint('system', __name__)

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

# Settings endpoints
@system_bp.route('/settings', methods=['GET'])
@jwt_required()
def get_settings():
    """Get system settings."""
    try:
        if current_user.has_role('admin'):
            # Admins can see all settings
            settings = SystemSetting.query.all()
        else:
            # Regular users can only see public settings
            settings = SystemSetting.query.filter_by(is_public=True).all()
        
        return jsonify({
            'settings': [setting.to_dict() for setting in settings]
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get settings', 'details': str(e)}), 500

@system_bp.route('/settings/<key>', methods=['GET'])
@jwt_required()
def get_setting(key):
    """Get specific setting."""
    try:
        setting = SystemSetting.query.get(key)
        if not setting:
            return jsonify({'error': 'Setting not found'}), 404
        
        # Check if user can access this setting
        if not setting.is_public and not current_user.has_role('admin'):
            return jsonify({'error': 'Access denied'}), 403
        
        return jsonify({'setting': setting.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get setting', 'details': str(e)}), 500

@system_bp.route('/settings/<key>', methods=['PUT'])
@jwt_required()
def update_setting(key):
    """Update system setting (admin only)."""
    admin_check = require_admin()
    if admin_check:
        return admin_check
    
    try:
        setting = SystemSetting.query.get(key)
        if not setting:
            return jsonify({'error': 'Setting not found'}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        old_value = setting.get_typed_value()
        new_value = data.get('value')
        
        if new_value is None:
            return jsonify({'error': 'Value is required'}), 400
        
        setting.set_typed_value(new_value)
        
        # Update description if provided
        if 'description' in data:
            setting.description = data['description']
        
        # Log setting update
        ip_address, user_agent = get_client_info()
        AuditLog.log_action(
            user_id=current_user.id,
            action='setting_update',
            resource_type='system_setting',
            resource_id=key,
            old_values={'value': old_value},
            new_values={'value': new_value},
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        db.session.commit()
        
        return jsonify({'setting': setting.to_dict()}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Setting update failed', 'details': str(e)}), 500

@system_bp.route('/settings', methods=['POST'])
@jwt_required()
def create_setting():
    """Create new system setting (admin only)."""
    admin_check = require_admin()
    if admin_check:
        return admin_check
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        key = data.get('key', '').strip()
        value = data.get('value')
        description = data.get('description', '').strip()
        data_type = data.get('data_type', 'string')
        is_public = data.get('is_public', False)
        
        if not key:
            return jsonify({'error': 'Setting key is required'}), 400
        
        if value is None:
            return jsonify({'error': 'Setting value is required'}), 400
        
        if data_type not in SystemSetting.DATA_TYPE_CHOICES:
            return jsonify({'error': 'Invalid data type'}), 400
        
        # Check if setting already exists
        existing_setting = SystemSetting.query.get(key)
        if existing_setting:
            return jsonify({'error': 'Setting already exists'}), 400
        
        setting = SystemSetting.set_setting(key, value, description, data_type, is_public)
        
        # Log setting creation
        ip_address, user_agent = get_client_info()
        AuditLog.log_action(
            user_id=current_user.id,
            action='setting_create',
            resource_type='system_setting',
            resource_id=key,
            new_values=setting.to_dict(),
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        return jsonify({'setting': setting.to_dict()}), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Setting creation failed', 'details': str(e)}), 500

# Health endpoints
@system_bp.route('/health', methods=['GET'])
def get_system_health():
    """Get system health status."""
    try:
        # Get latest health checks for each service
        services = ['database', 'ollama', 'redis', 'n8n']
        health_status = {}
        
        for service in services:
            latest = SystemHealth.query.filter_by(service_name=service).order_by(
                SystemHealth.checked_at.desc()
            ).first()
            
            if latest:
                health_status[service] = {
                    'status': latest.status,
                    'response_time': latest.response_time,
                    'last_check': latest.checked_at.isoformat(),
                    'error_message': latest.error_message
                }
            else:
                health_status[service] = {
                    'status': 'unknown',
                    'response_time': None,
                    'last_check': None,
                    'error_message': 'No health check data'
                }
        
        # Determine overall system status
        statuses = [service['status'] for service in health_status.values()]
        if 'critical' in statuses:
            overall_status = 'critical'
        elif 'warning' in statuses:
            overall_status = 'warning'
        elif all(status == 'healthy' for status in statuses):
            overall_status = 'healthy'
        else:
            overall_status = 'unknown'
        
        return jsonify({
            'overall_status': overall_status,
            'services': health_status,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get health status', 'details': str(e)}), 500

@system_bp.route('/health/<service_name>', methods=['POST'])
@jwt_required()
def record_health_check(service_name):
    """Record health check result (admin only)."""
    admin_check = require_admin()
    if admin_check:
        return admin_check
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        status = data.get('status')
        response_time = data.get('response_time')
        error_message = data.get('error_message')
        metadata = data.get('metadata', {})
        
        if status not in SystemHealth.STATUS_CHOICES:
            return jsonify({'error': 'Invalid status'}), 400
        
        health = SystemHealth.record_health_check(
            service_name=service_name,
            status=status,
            response_time=response_time,
            error_message=error_message,
            metadata=metadata
        )
        
        return jsonify({'health_check': health.to_dict()}), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Health check recording failed', 'details': str(e)}), 500

# Audit logs endpoints
@system_bp.route('/audit-logs', methods=['GET'])
@jwt_required()
def get_audit_logs():
    """Get audit logs (admin only)."""
    admin_check = require_admin()
    if admin_check:
        return admin_check
    
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        action = request.args.get('action', '').strip()
        resource_type = request.args.get('resource_type', '').strip()
        user_id = request.args.get('user_id', '').strip()
        
        query = AuditLog.query
        
        if action:
            query = query.filter(AuditLog.action.contains(action))
        
        if resource_type:
            query = query.filter_by(resource_type=resource_type)
        
        if user_id:
            query = query.filter_by(user_id=user_id)
        
        logs = query.order_by(AuditLog.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'logs': [log.to_dict() for log in logs.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': logs.total,
                'pages': logs.pages,
                'has_next': logs.has_next,
                'has_prev': logs.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get audit logs', 'details': str(e)}), 500

# Dashboard statistics
@system_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    """Get dashboard statistics."""
    try:
        if current_user.has_role('admin'):
            # Admin dashboard - system-wide stats
            total_users = User.query.count()
            active_users = User.query.filter_by(is_active=True).count()
            total_tickets = Ticket.query.count()
            open_tickets = Ticket.query.filter_by(status='open').count()
            total_articles = KnowledgeArticle.query.filter_by(status='published').count()
            total_conversations = ChatConversation.query.filter_by(is_active=True).count()
            
            # Recent activity (last 7 days)
            week_ago = datetime.now(timezone.utc) - timedelta(days=7)
            recent_tickets = Ticket.query.filter(Ticket.created_at >= week_ago).count()
            recent_articles = KnowledgeArticle.query.filter(KnowledgeArticle.created_at >= week_ago).count()
            recent_conversations = ChatConversation.query.filter(ChatConversation.created_at >= week_ago).count()
            
            return jsonify({
                'total_users': total_users,
                'active_users': active_users,
                'total_tickets': total_tickets,
                'open_tickets': open_tickets,
                'total_articles': total_articles,
                'total_conversations': total_conversations,
                'recent_activity': {
                    'tickets': recent_tickets,
                    'articles': recent_articles,
                    'conversations': recent_conversations
                }
            }), 200
            
        elif current_user.has_role('support'):
            # Support dashboard
            my_assigned_tickets = Ticket.query.filter_by(assignee_id=current_user.id).filter(
                Ticket.status.in_(['open', 'pending'])
            ).count()
            
            total_open_tickets = Ticket.query.filter_by(status='open').count()
            total_pending_tickets = Ticket.query.filter_by(status='pending').count()
            high_priority_tickets = Ticket.query.filter_by(priority='high').filter(
                Ticket.status.in_(['open', 'pending'])
            ).count()
            
            return jsonify({
                'my_assigned_tickets': my_assigned_tickets,
                'total_open_tickets': total_open_tickets,
                'total_pending_tickets': total_pending_tickets,
                'high_priority_tickets': high_priority_tickets
            }), 200
            
        else:
            # User dashboard
            my_tickets = Ticket.query.filter_by(requester_id=current_user.id)
            my_open_tickets = my_tickets.filter_by(status='open').count()
            my_pending_tickets = my_tickets.filter_by(status='pending').count()
            my_conversations = ChatConversation.query.filter_by(
                user_id=current_user.id,
                is_active=True
            ).count()
            
            return jsonify({
                'my_open_tickets': my_open_tickets,
                'my_pending_tickets': my_pending_tickets,
                'my_conversations': my_conversations
            }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get dashboard stats', 'details': str(e)}), 500

# Notifications endpoints
@system_bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    """Get user notifications."""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        unread_only = request.args.get('unread_only', 'false').lower() == 'true'
        
        query = Notification.query.filter_by(user_id=current_user.id)
        
        if unread_only:
            query = query.filter_by(is_read=False)
        
        notifications = query.order_by(Notification.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'notifications': [notif.to_dict() for notif in notifications.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': notifications.total,
                'pages': notifications.pages,
                'has_next': notifications.has_next,
                'has_prev': notifications.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get notifications', 'details': str(e)}), 500

@system_bp.route('/notifications/<notification_id>/read', methods=['POST'])
@jwt_required()
def mark_notification_read(notification_id):
    """Mark notification as read."""
    try:
        notification = Notification.query.filter_by(
            id=notification_id,
            user_id=current_user.id
        ).first()
        
        if not notification:
            return jsonify({'error': 'Notification not found'}), 404
        
        notification.mark_as_read()
        
        return jsonify({'message': 'Notification marked as read'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to mark notification as read', 'details': str(e)}), 500

# System information
@system_bp.route('/info', methods=['GET'])
def get_system_info():
    """Get system information."""
    try:
        site_name = SystemSetting.get_setting('site_name', 'BEwithU')
        site_description = SystemSetting.get_setting('site_description', 'Intelligent IT Support System')
        default_language = SystemSetting.get_setting('default_language', 'ja')
        enable_registration = SystemSetting.get_setting('enable_registration', False)
        
        return jsonify({
            'site_name': site_name,
            'site_description': site_description,
            'default_language': default_language,
            'enable_registration': enable_registration,
            'version': '1.0.0',
            'supported_languages': ['ja', 'zh', 'en']
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get system info', 'details': str(e)}), 500

