import uuid
import json
from datetime import datetime, timezone
from . import db

class ChatConversation(db.Model):
    """Chat conversation model."""
    
    __tablename__ = 'chat_conversations'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    title = db.Column(db.String(255))
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    messages = db.relationship('ChatMessage', backref='conversation', lazy='dynamic', cascade='all, delete-orphan', order_by='ChatMessage.created_at')
    
    def __repr__(self):
        return f'<ChatConversation {self.id}>'
    
    def get_message_count(self):
        """Get total message count."""
        return self.messages.count()
    
    def get_last_message(self):
        """Get the last message in conversation."""
        return self.messages.order_by(ChatMessage.created_at.desc()).first()
    
    def generate_title(self):
        """Generate title from first user message."""
        first_user_message = self.messages.filter_by(role='user').first()
        if first_user_message:
            # Take first 50 characters of the message
            content = first_user_message.content[:50]
            if len(first_user_message.content) > 50:
                content += '...'
            self.title = content
            db.session.commit()
        return self.title
    
    def archive(self):
        """Archive the conversation."""
        self.is_active = False
        db.session.commit()
    
    def restore(self):
        """Restore archived conversation."""
        self.is_active = True
        db.session.commit()
    
    def to_dict(self, include_messages=False):
        """Convert conversation to dictionary."""
        last_message = self.get_last_message()
        
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title or 'New Conversation',
            'is_active': self.is_active,
            'message_count': self.get_message_count(),
            'last_message_at': last_message.created_at.isoformat() if last_message else None,
            'last_message_preview': last_message.content[:100] + '...' if last_message and len(last_message.content) > 100 else last_message.content if last_message else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_messages:
            data['messages'] = [message.to_dict() for message in self.messages.order_by(ChatMessage.created_at)]
            
        return data

class ChatMessage(db.Model):
    """Chat message model."""
    
    __tablename__ = 'chat_messages'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = db.Column(db.String(36), db.ForeignKey('chat_conversations.id'), nullable=False, index=True)
    role = db.Column(db.String(20), nullable=False, index=True)  # 'user', 'assistant', 'system'
    content = db.Column(db.Text, nullable=False)
    message_metadata = db.Column(db.JSON)  # Store additional metadata like model info, tokens, etc.
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    
    # Role choices
    ROLE_CHOICES = ['user', 'assistant', 'system']
    
    def __repr__(self):
        return f'<ChatMessage {self.id}>'
    
    def set_metadata(self, **kwargs):
        """Set metadata as JSON."""
        if self.message_metadata is None:
            self.message_metadata = {}
        self.message_metadata.update(kwargs)
        db.session.commit()
    
    def get_metadata(self, key, default=None):
        """Get metadata value."""
        if self.message_metadata:
            return self.message_metadata.get(key, default)
        return default
    
    def get_word_count(self):
        """Get word count of the message."""
        return len(self.content.split())
    
    def get_character_count(self):
        """Get character count of the message."""
        return len(self.content)
    
    def to_dict(self):
        """Convert message to dictionary."""
        return {
            'id': self.id,
            'conversation_id': self.conversation_id,
            'role': self.role,
            'content': self.content,
            'metadata': self.message_metadata,
            'word_count': self.get_word_count(),
            'character_count': self.get_character_count(),
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    @staticmethod
    def create_message(conversation_id, role, content, metadata=None):
        """Create a new message."""
        message = ChatMessage(
            conversation_id=conversation_id,
            role=role,
            content=content,
            message_metadata=metadata or {}
        )
        db.session.add(message)
        
        # Update conversation's updated_at timestamp
        conversation = ChatConversation.query.get(conversation_id)
        if conversation:
            conversation.updated_at = datetime.now(timezone.utc)
            
            # Generate title if this is the first user message and no title exists
            if not conversation.title and role == 'user':
                conversation.generate_title()
        
        db.session.commit()
        return message

class ChatTemplate(db.Model):
    """Chat template model for predefined responses."""
    
    __tablename__ = 'chat_templates'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    category = db.Column(db.String(50), index=True)
    template_content = db.Column(db.Text, nullable=False)
    variables = db.Column(db.JSON)  # Store template variables
    is_active = db.Column(db.Boolean, default=True)
    usage_count = db.Column(db.Integer, default=0)
    created_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    def __repr__(self):
        return f'<ChatTemplate {self.name}>'
    
    def render(self, **kwargs):
        """Render template with provided variables."""
        content = self.template_content
        if self.variables:
            for var in self.variables:
                placeholder = f"{{{var}}}"
                value = kwargs.get(var, f"[{var}]")
                content = content.replace(placeholder, str(value))
        return content
    
    def increment_usage(self):
        """Increment usage count."""
        self.usage_count += 1
        db.session.commit()
    
    def to_dict(self):
        """Convert template to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'category': self.category,
            'template_content': self.template_content,
            'variables': self.variables,
            'is_active': self.is_active,
            'usage_count': self.usage_count,
            'created_by': self.created_by,
            'creator_name': self.creator.display_name if hasattr(self, 'creator') and self.creator else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    # Relationship to creator
    creator = db.relationship('User', foreign_keys=[created_by])

