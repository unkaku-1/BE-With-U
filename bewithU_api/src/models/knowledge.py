import uuid
from datetime import datetime, timezone
from . import db

# Association table for many-to-many relationship between articles and tags
knowledge_article_tags = db.Table('knowledge_article_tags',
    db.Column('article_id', db.String(36), db.ForeignKey('knowledge_articles.id'), primary_key=True),
    db.Column('tag_id', db.String(36), db.ForeignKey('knowledge_tags.id'), primary_key=True)
)

class KnowledgeCategory(db.Model):
    """Knowledge base category model."""
    
    __tablename__ = 'knowledge_categories'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    parent_id = db.Column(db.String(36), db.ForeignKey('knowledge_categories.id'), index=True)
    sort_order = db.Column(db.Integer, default=0, index=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Self-referential relationship for parent/child categories
    children = db.relationship('KnowledgeCategory', backref=db.backref('parent', remote_side=[id]), lazy='dynamic')
    articles = db.relationship('KnowledgeArticle', backref='category', lazy='dynamic')
    
    def __repr__(self):
        return f'<KnowledgeCategory {self.name}>'
    
    def get_full_path(self):
        """Get full category path."""
        path = [self.name]
        parent = self.parent
        while parent:
            path.insert(0, parent.name)
            parent = parent.parent
        return ' > '.join(path)
    
    def get_article_count(self):
        """Get count of published articles in this category."""
        return self.articles.filter_by(status='published').count()
    
    def to_dict(self, include_children=False):
        """Convert category to dictionary."""
        data = {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'parent_id': self.parent_id,
            'sort_order': self.sort_order,
            'is_active': self.is_active,
            'full_path': self.get_full_path(),
            'article_count': self.get_article_count(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_children:
            data['children'] = [child.to_dict() for child in self.children.filter_by(is_active=True).order_by(KnowledgeCategory.sort_order)]
            
        return data

class KnowledgeArticle(db.Model):
    """Knowledge base article model."""
    
    __tablename__ = 'knowledge_articles'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = db.Column(db.String(255), nullable=False)
    content = db.Column(db.Text, nullable=False)
    summary = db.Column(db.Text)
    category_id = db.Column(db.String(36), db.ForeignKey('knowledge_categories.id'), index=True)
    author_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    status = db.Column(db.String(20), default='draft', nullable=False, index=True)
    language = db.Column(db.String(5), default='ja', nullable=False, index=True)
    view_count = db.Column(db.Integer, default=0)
    is_featured = db.Column(db.Boolean, default=False)
    published_at = db.Column(db.DateTime(timezone=True), index=True)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Many-to-many relationship with tags
    tags = db.relationship('KnowledgeTag', secondary=knowledge_article_tags, lazy='subquery',
                          backref=db.backref('articles', lazy=True))
    
    def __repr__(self):
        return f'<KnowledgeArticle {self.title}>'
    
    def publish(self):
        """Publish the article."""
        self.status = 'published'
        self.published_at = datetime.now(timezone.utc)
        db.session.commit()
    
    def unpublish(self):
        """Unpublish the article."""
        self.status = 'draft'
        self.published_at = None
        db.session.commit()
    
    def increment_view_count(self):
        """Increment view count."""
        self.view_count += 1
        db.session.commit()
    
    def to_dict(self, include_content=True):
        """Convert article to dictionary."""
        data = {
            'id': self.id,
            'title': self.title,
            'summary': self.summary,
            'category_id': self.category_id,
            'category_name': self.category.name if self.category else None,
            'author_id': self.author_id,
            'author_name': self.author.display_name if self.author else None,
            'status': self.status,
            'language': self.language,
            'view_count': self.view_count,
            'is_featured': self.is_featured,
            'tags': [tag.to_dict() for tag in self.tags],
            'published_at': self.published_at.isoformat() if self.published_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_content:
            data['content'] = self.content
            
        return data
    
    @staticmethod
    def search(query, category_id=None, language=None, status='published'):
        """Search articles by query."""
        articles = KnowledgeArticle.query.filter_by(status=status)
        
        if category_id:
            articles = articles.filter_by(category_id=category_id)
            
        if language:
            articles = articles.filter_by(language=language)
            
        if query:
            # Simple text search - in production, consider using full-text search
            articles = articles.filter(
                db.or_(
                    KnowledgeArticle.title.contains(query),
                    KnowledgeArticle.content.contains(query),
                    KnowledgeArticle.summary.contains(query)
                )
            )
        
        return articles.order_by(KnowledgeArticle.updated_at.desc())

class KnowledgeTag(db.Model):
    """Knowledge base tag model."""
    
    __tablename__ = 'knowledge_tags'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(50), unique=True, nullable=False, index=True)
    color = db.Column(db.String(7), default='#6B7280')  # Hex color code
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    def __repr__(self):
        return f'<KnowledgeTag {self.name}>'
    
    def get_article_count(self):
        """Get count of published articles with this tag."""
        return len([article for article in self.articles if article.status == 'published'])
    
    def to_dict(self):
        """Convert tag to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'color': self.color,
            'article_count': self.get_article_count(),
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    @staticmethod
    def get_or_create(name, color='#6B7280'):
        """Get existing tag or create new one."""
        tag = KnowledgeTag.query.filter_by(name=name).first()
        if not tag:
            tag = KnowledgeTag(name=name, color=color)
            db.session.add(tag)
            db.session.commit()
        return tag

