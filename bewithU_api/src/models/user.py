import uuid
from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from . import db

class User(db.Model):
    """User model for authentication and profile management."""
    
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = db.Column(db.String(50), unique=True, nullable=False, index=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    display_name = db.Column(db.String(100))
    role = db.Column(db.String(20), default='user', nullable=False, index=True)
    language = db.Column(db.String(5), default='ja', nullable=False)
    avatar_url = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    last_login_at = db.Column(db.DateTime(timezone=True))
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    sessions = db.relationship('UserSession', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    knowledge_articles = db.relationship('KnowledgeArticle', backref='author', lazy='dynamic')
    tickets_created = db.relationship('Ticket', foreign_keys='Ticket.requester_id', backref='requester', lazy='dynamic')
    tickets_assigned = db.relationship('Ticket', foreign_keys='Ticket.assignee_id', backref='assignee', lazy='dynamic')
    ticket_comments = db.relationship('TicketComment', backref='author', lazy='dynamic')
    chat_conversations = db.relationship('ChatConversation', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    audit_logs = db.relationship('AuditLog', backref='user', lazy='dynamic')
    
    def __repr__(self):
        return f'<User {self.username}>'
    
    def set_password(self, password):
        """Set password hash."""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check password against hash."""
        return check_password_hash(self.password_hash, password)
    
    def update_last_login(self):
        """Update last login timestamp."""
        self.last_login_at = datetime.now(timezone.utc)
        db.session.commit()
    
    def has_role(self, role):
        """Check if user has specific role."""
        role_hierarchy = {'user': 0, 'support': 1, 'admin': 2}
        user_level = role_hierarchy.get(self.role, 0)
        required_level = role_hierarchy.get(role, 0)
        return user_level >= required_level
    
    def to_dict(self, include_sensitive=False):
        """Convert user to dictionary."""
        data = {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'display_name': self.display_name,
            'role': self.role,
            'language': self.language,
            'avatar_url': self.avatar_url,
            'is_active': self.is_active,
            'last_login_at': self.last_login_at.isoformat() if self.last_login_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_sensitive:
            data['password_hash'] = self.password_hash
            
        return data
    
    @staticmethod
    def create_user(username, email, password, display_name=None, role='user', language='ja'):
        """Create a new user."""
        user = User(
            username=username,
            email=email,
            display_name=display_name or username,
            role=role,
            language=language
        )
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        return user

class UserSession(db.Model):
    """User session model for JWT token management."""
    
    __tablename__ = 'user_sessions'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    token_hash = db.Column(db.String(255), nullable=False, index=True)
    refresh_token_hash = db.Column(db.String(255))
    expires_at = db.Column(db.DateTime(timezone=True), nullable=False, index=True)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    last_used_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    user_agent = db.Column(db.Text)
    ip_address = db.Column(db.String(45))  # IPv6 compatible
    
    def __repr__(self):
        return f'<UserSession {self.id}>'
    
    def is_expired(self):
        """Check if session is expired."""
        return datetime.now(timezone.utc) > self.expires_at
    
    def update_last_used(self):
        """Update last used timestamp."""
        self.last_used_at = datetime.now(timezone.utc)
        db.session.commit()
    
    def to_dict(self):
        """Convert session to dictionary."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_used_at': self.last_used_at.isoformat() if self.last_used_at else None,
            'user_agent': self.user_agent,
            'ip_address': self.ip_address
        }

