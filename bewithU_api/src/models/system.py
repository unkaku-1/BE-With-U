import uuid
import json
from datetime import datetime, timezone
from . import db

class SystemSetting(db.Model):
    """System settings model."""
    
    __tablename__ = 'system_settings'
    
    key = db.Column(db.String(100), primary_key=True)
    value = db.Column(db.Text)
    description = db.Column(db.Text)
    data_type = db.Column(db.String(20), default='string', nullable=False)
    is_public = db.Column(db.Boolean, default=False)  # Whether setting is visible to non-admin users
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Data type choices
    DATA_TYPE_CHOICES = ['string', 'integer', 'boolean', 'json']
    
    def __repr__(self):
        return f'<SystemSetting {self.key}>'
    
    def get_typed_value(self):
        """Get value converted to appropriate type."""
        if self.data_type == 'integer':
            try:
                return int(self.value)
            except (ValueError, TypeError):
                return 0
        elif self.data_type == 'boolean':
            return self.value.lower() in ['true', '1', 'yes', 'on'] if self.value else False
        elif self.data_type == 'json':
            try:
                return json.loads(self.value) if self.value else {}
            except json.JSONDecodeError:
                return {}
        else:
            return self.value or ''
    
    def set_typed_value(self, value):
        """Set value with type conversion."""
        if self.data_type == 'json':
            self.value = json.dumps(value) if value is not None else None
        else:
            self.value = str(value) if value is not None else None
        db.session.commit()
    
    def to_dict(self):
        """Convert setting to dictionary."""
        return {
            'key': self.key,
            'value': self.get_typed_value(),
            'raw_value': self.value,
            'description': self.description,
            'data_type': self.data_type,
            'is_public': self.is_public,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @staticmethod
    def get_setting(key, default=None):
        """Get setting value by key."""
        setting = SystemSetting.query.get(key)
        if setting:
            return setting.get_typed_value()
        return default
    
    @staticmethod
    def set_setting(key, value, description=None, data_type='string', is_public=False):
        """Set or update setting."""
        setting = SystemSetting.query.get(key)
        if setting:
            setting.set_typed_value(value)
            if description:
                setting.description = description
        else:
            setting = SystemSetting(
                key=key,
                description=description,
                data_type=data_type,
                is_public=is_public
            )
            setting.set_typed_value(value)
            db.session.add(setting)
        db.session.commit()
        return setting

class AuditLog(db.Model):
    """Audit log model for tracking user actions."""
    
    __tablename__ = 'audit_logs'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), index=True)
    action = db.Column(db.String(100), nullable=False, index=True)
    resource_type = db.Column(db.String(50), nullable=False, index=True)
    resource_id = db.Column(db.String(36), index=True)
    old_values = db.Column(db.JSON)
    new_values = db.Column(db.JSON)
    ip_address = db.Column(db.String(45))  # IPv6 compatible
    user_agent = db.Column(db.Text)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    
    def __repr__(self):
        return f'<AuditLog {self.action} on {self.resource_type}>'
    
    def to_dict(self):
        """Convert audit log to dictionary."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_name': self.user.display_name if self.user else 'System',
            'action': self.action,
            'resource_type': self.resource_type,
            'resource_id': self.resource_id,
            'old_values': self.old_values,
            'new_values': self.new_values,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    @staticmethod
    def log_action(user_id, action, resource_type, resource_id=None, old_values=None, new_values=None, ip_address=None, user_agent=None):
        """Create audit log entry."""
        log = AuditLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            old_values=old_values,
            new_values=new_values,
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.session.add(log)
        db.session.commit()
        return log

class SystemHealth(db.Model):
    """System health monitoring model."""
    
    __tablename__ = 'system_health'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    service_name = db.Column(db.String(50), nullable=False, index=True)
    status = db.Column(db.String(20), nullable=False, index=True)  # 'healthy', 'warning', 'critical'
    response_time = db.Column(db.Float)  # Response time in milliseconds
    error_message = db.Column(db.Text)
    health_metadata = db.Column(db.JSON)
    checked_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    
    # Status choices
    STATUS_CHOICES = ['healthy', 'warning', 'critical']
    
    def __repr__(self):
        return f'<SystemHealth {self.service_name}: {self.status}>'
    
    def to_dict(self):
        """Convert health check to dictionary."""
        return {
            'id': self.id,
            'service_name': self.service_name,
            'status': self.status,
            'response_time': self.response_time,
            'error_message': self.error_message,
            'metadata': self.health_metadata,
            'checked_at': self.checked_at.isoformat() if self.checked_at else None
        }
    
    @staticmethod
    def record_health_check(service_name, status, response_time=None, error_message=None, metadata=None):
        """Record health check result."""
        health = SystemHealth(
            service_name=service_name,
            status=status,
            response_time=response_time,
            error_message=error_message,
            health_metadata=metadata or {}
        )
        db.session.add(health)
        db.session.commit()
        return health
    
    @staticmethod
    def get_latest_status(service_name):
        """Get latest status for a service."""
        latest = SystemHealth.query.filter_by(service_name=service_name).order_by(SystemHealth.checked_at.desc()).first()
        return latest.status if latest else 'unknown'

class Notification(db.Model):
    """System notification model."""
    
    __tablename__ = 'notifications'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), index=True)
    title = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(20), default='info', nullable=False, index=True)  # 'info', 'success', 'warning', 'error'
    is_read = db.Column(db.Boolean, default=False, index=True)
    action_url = db.Column(db.String(255))
    expires_at = db.Column(db.DateTime(timezone=True))
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    read_at = db.Column(db.DateTime(timezone=True))
    
    # Type choices
    TYPE_CHOICES = ['info', 'success', 'warning', 'error']
    
    def __repr__(self):
        return f'<Notification {self.title}>'
    
    def mark_as_read(self):
        """Mark notification as read."""
        self.is_read = True
        self.read_at = datetime.now(timezone.utc)
        db.session.commit()
    
    def is_expired(self):
        """Check if notification is expired."""
        if self.expires_at:
            return datetime.now(timezone.utc) > self.expires_at
        return False
    
    def to_dict(self):
        """Convert notification to dictionary."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'message': self.message,
            'type': self.type,
            'is_read': self.is_read,
            'action_url': self.action_url,
            'is_expired': self.is_expired(),
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'read_at': self.read_at.isoformat() if self.read_at else None
        }
    
    @staticmethod
    def create_notification(user_id, title, message, type='info', action_url=None, expires_at=None):
        """Create a new notification."""
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            type=type,
            action_url=action_url,
            expires_at=expires_at
        )
        db.session.add(notification)
        db.session.commit()
        return notification
    
    @staticmethod
    def create_system_notification(title, message, type='info', action_url=None, expires_at=None):
        """Create a system-wide notification (for all users)."""
        # This would typically be handled by creating notifications for all active users
        # or by using a separate system_notifications table
        pass

