import uuid
from datetime import datetime, timezone
from . import db

class Ticket(db.Model):
    """Support ticket model."""
    
    __tablename__ = 'tickets'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ticket_number = db.Column(db.String(20), unique=True, nullable=False, index=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='open', nullable=False, index=True)
    priority = db.Column(db.String(20), default='normal', nullable=False, index=True)
    category = db.Column(db.String(50), index=True)
    requester_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    assignee_id = db.Column(db.String(36), db.ForeignKey('users.id'), index=True)
    resolved_at = db.Column(db.DateTime(timezone=True))
    closed_at = db.Column(db.DateTime(timezone=True))
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    comments = db.relationship('TicketComment', backref='ticket', lazy='dynamic', cascade='all, delete-orphan', order_by='TicketComment.created_at')
    attachments = db.relationship('TicketAttachment', backref='ticket', lazy='dynamic', cascade='all, delete-orphan')
    
    # Status choices
    STATUS_CHOICES = ['open', 'pending', 'resolved', 'closed']
    PRIORITY_CHOICES = ['low', 'normal', 'high', 'urgent']
    
    def __repr__(self):
        return f'<Ticket {self.ticket_number}>'
    
    def __init__(self, **kwargs):
        super(Ticket, self).__init__(**kwargs)
        if not self.ticket_number:
            self.ticket_number = self.generate_ticket_number()
    
    @staticmethod
    def generate_ticket_number():
        """Generate unique ticket number."""
        # Get the latest ticket number
        latest_ticket = Ticket.query.order_by(Ticket.created_at.desc()).first()
        if latest_ticket and latest_ticket.ticket_number:
            try:
                # Extract number from format T-000001
                number = int(latest_ticket.ticket_number.split('-')[1]) + 1
            except (IndexError, ValueError):
                number = 1
        else:
            number = 1
        
        return f'T-{number:06d}'
    
    def assign_to(self, user_id):
        """Assign ticket to a user."""
        self.assignee_id = user_id
        self.status = 'pending'
        db.session.commit()
    
    def resolve(self):
        """Mark ticket as resolved."""
        self.status = 'resolved'
        self.resolved_at = datetime.now(timezone.utc)
        db.session.commit()
    
    def close(self):
        """Close the ticket."""
        self.status = 'closed'
        self.closed_at = datetime.now(timezone.utc)
        if not self.resolved_at:
            self.resolved_at = self.closed_at
        db.session.commit()
    
    def reopen(self):
        """Reopen the ticket."""
        self.status = 'open'
        self.resolved_at = None
        self.closed_at = None
        db.session.commit()
    
    def get_response_time(self):
        """Get response time in hours."""
        if self.comments.count() > 0:
            first_response = self.comments.first()
            if first_response and first_response.author_id != self.requester_id:
                delta = first_response.created_at - self.created_at
                return delta.total_seconds() / 3600
        return None
    
    def get_resolution_time(self):
        """Get resolution time in hours."""
        if self.resolved_at:
            delta = self.resolved_at - self.created_at
            return delta.total_seconds() / 3600
        return None
    
    def to_dict(self, include_comments=False, include_attachments=False):
        """Convert ticket to dictionary."""
        data = {
            'id': self.id,
            'ticket_number': self.ticket_number,
            'title': self.title,
            'description': self.description,
            'status': self.status,
            'priority': self.priority,
            'category': self.category,
            'requester_id': self.requester_id,
            'requester_name': self.requester.display_name if self.requester else None,
            'assignee_id': self.assignee_id,
            'assignee_name': self.assignee.display_name if self.assignee else None,
            'response_time': self.get_response_time(),
            'resolution_time': self.get_resolution_time(),
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'closed_at': self.closed_at.isoformat() if self.closed_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_comments:
            data['comments'] = [comment.to_dict() for comment in self.comments]
            
        if include_attachments:
            data['attachments'] = [attachment.to_dict() for attachment in self.attachments]
            
        return data

class TicketComment(db.Model):
    """Ticket comment model."""
    
    __tablename__ = 'ticket_comments'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ticket_id = db.Column(db.String(36), db.ForeignKey('tickets.id'), nullable=False, index=True)
    author_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    content = db.Column(db.Text, nullable=False)
    is_internal = db.Column(db.Boolean, default=False)  # Internal notes not visible to requester
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    attachments = db.relationship('TicketAttachment', backref='comment', lazy='dynamic', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<TicketComment {self.id}>'
    
    def to_dict(self, include_attachments=False):
        """Convert comment to dictionary."""
        data = {
            'id': self.id,
            'ticket_id': self.ticket_id,
            'author_id': self.author_id,
            'author_name': self.author.display_name if self.author else None,
            'content': self.content,
            'is_internal': self.is_internal,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_attachments:
            data['attachments'] = [attachment.to_dict() for attachment in self.attachments]
            
        return data

class TicketAttachment(db.Model):
    """Ticket attachment model."""
    
    __tablename__ = 'ticket_attachments'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ticket_id = db.Column(db.String(36), db.ForeignKey('tickets.id'), nullable=False, index=True)
    comment_id = db.Column(db.String(36), db.ForeignKey('ticket_comments.id'), index=True)
    filename = db.Column(db.String(255), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    file_size = db.Column(db.Integer, nullable=False)
    mime_type = db.Column(db.String(100))
    file_path = db.Column(db.Text, nullable=False)
    uploaded_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    def __repr__(self):
        return f'<TicketAttachment {self.original_filename}>'
    
    def get_file_size_human(self):
        """Get human readable file size."""
        size = self.file_size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024.0:
                return f"{size:.1f} {unit}"
            size /= 1024.0
        return f"{size:.1f} TB"
    
    def to_dict(self):
        """Convert attachment to dictionary."""
        return {
            'id': self.id,
            'ticket_id': self.ticket_id,
            'comment_id': self.comment_id,
            'filename': self.filename,
            'original_filename': self.original_filename,
            'file_size': self.file_size,
            'file_size_human': self.get_file_size_human(),
            'mime_type': self.mime_type,
            'file_path': self.file_path,
            'uploaded_by': self.uploaded_by,
            'uploader_name': self.uploader.display_name if hasattr(self, 'uploader') and self.uploader else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    # Relationship to uploader
    uploader = db.relationship('User', foreign_keys=[uploaded_by])

