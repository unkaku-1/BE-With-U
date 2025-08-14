from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, current_user
from sqlalchemy import or_

from src.models import db
from src.models.knowledge import KnowledgeCategory, KnowledgeArticle, KnowledgeTag
from src.models.system import AuditLog

knowledge_bp = Blueprint('knowledge', __name__)

def get_client_info():
    """Get client IP and User-Agent."""
    ip_address = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
    user_agent = request.headers.get('User-Agent', '')
    return ip_address, user_agent

# Categories endpoints
@knowledge_bp.route('/categories', methods=['GET'])
def get_categories():
    """Get knowledge base categories."""
    try:
        include_children = request.args.get('include_children', 'false').lower() == 'true'
        
        # Get root categories (no parent)
        categories = KnowledgeCategory.query.filter_by(
            parent_id=None, 
            is_active=True
        ).order_by(KnowledgeCategory.sort_order).all()
        
        return jsonify({
            'categories': [cat.to_dict(include_children=include_children) for cat in categories]
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get categories', 'details': str(e)}), 500

@knowledge_bp.route('/categories', methods=['POST'])
@jwt_required()
def create_category():
    """Create new category (admin/support only)."""
    try:
        if not current_user.has_role('support'):
            return jsonify({'error': 'Support access required'}), 403
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        name = data.get('name', '').strip()
        description = data.get('description', '').strip()
        parent_id = data.get('parent_id')
        sort_order = data.get('sort_order', 0)
        
        if not name:
            return jsonify({'error': 'Category name is required'}), 400
        
        # Check if parent exists
        if parent_id:
            parent = KnowledgeCategory.query.get(parent_id)
            if not parent:
                return jsonify({'error': 'Parent category not found'}), 404
        
        category = KnowledgeCategory(
            name=name,
            description=description,
            parent_id=parent_id,
            sort_order=sort_order
        )
        
        db.session.add(category)
        db.session.commit()
        
        # Log category creation
        ip_address, user_agent = get_client_info()
        AuditLog.log_action(
            user_id=current_user.id,
            action='category_create',
            resource_type='knowledge_category',
            resource_id=category.id,
            new_values=category.to_dict(),
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        return jsonify({'category': category.to_dict()}), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Category creation failed', 'details': str(e)}), 500

# Articles endpoints
@knowledge_bp.route('/articles', methods=['GET'])
def get_articles():
    """Get knowledge base articles."""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '').strip()
        category_id = request.args.get('category_id', '').strip()
        language = request.args.get('language', '').strip()
        featured = request.args.get('featured', '').strip()
        
        # Build query
        query = KnowledgeArticle.query.filter_by(status='published')
        
        if search:
            query = KnowledgeArticle.search(
                query=search,
                category_id=category_id if category_id else None,
                language=language if language else None
            )
        else:
            if category_id:
                query = query.filter_by(category_id=category_id)
            
            if language:
                query = query.filter_by(language=language)
        
        if featured and featured.lower() == 'true':
            query = query.filter_by(is_featured=True)
        
        # Paginate results
        articles = query.order_by(KnowledgeArticle.updated_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'articles': [article.to_dict(include_content=False) for article in articles.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': articles.total,
                'pages': articles.pages,
                'has_next': articles.has_next,
                'has_prev': articles.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get articles', 'details': str(e)}), 500

@knowledge_bp.route('/articles/<article_id>', methods=['GET'])
def get_article(article_id):
    """Get specific article."""
    try:
        article = KnowledgeArticle.query.get(article_id)
        if not article:
            return jsonify({'error': 'Article not found'}), 404
        
        if article.status != 'published':
            # Only allow author and support users to view unpublished articles
            if not current_user or (current_user.id != article.author_id and not current_user.has_role('support')):
                return jsonify({'error': 'Article not found'}), 404
        
        # Increment view count for published articles
        if article.status == 'published':
            article.increment_view_count()
        
        return jsonify({'article': article.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get article', 'details': str(e)}), 500

@knowledge_bp.route('/articles', methods=['POST'])
@jwt_required()
def create_article():
    """Create new article."""
    try:
        if not current_user.has_role('support'):
            return jsonify({'error': 'Support access required'}), 403
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        title = data.get('title', '').strip()
        content = data.get('content', '').strip()
        summary = data.get('summary', '').strip()
        category_id = data.get('category_id')
        language = data.get('language', 'ja')
        tags = data.get('tags', [])
        is_featured = data.get('is_featured', False)
        
        if not title or not content:
            return jsonify({'error': 'Title and content are required'}), 400
        
        if language not in ['ja', 'zh', 'en']:
            return jsonify({'error': 'Invalid language'}), 400
        
        # Check if category exists
        if category_id:
            category = KnowledgeCategory.query.get(category_id)
            if not category:
                return jsonify({'error': 'Category not found'}), 404
        
        article = KnowledgeArticle(
            title=title,
            content=content,
            summary=summary,
            category_id=category_id,
            author_id=current_user.id,
            language=language,
            is_featured=is_featured
        )
        
        db.session.add(article)
        db.session.flush()  # Get article ID
        
        # Add tags
        for tag_name in tags:
            if tag_name.strip():
                tag = KnowledgeTag.get_or_create(tag_name.strip())
                article.tags.append(tag)
        
        db.session.commit()
        
        # Log article creation
        ip_address, user_agent = get_client_info()
        AuditLog.log_action(
            user_id=current_user.id,
            action='article_create',
            resource_type='knowledge_article',
            resource_id=article.id,
            new_values=article.to_dict(),
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        return jsonify({'article': article.to_dict()}), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Article creation failed', 'details': str(e)}), 500

@knowledge_bp.route('/articles/<article_id>/publish', methods=['POST'])
@jwt_required()
def publish_article(article_id):
    """Publish article."""
    try:
        if not current_user.has_role('support'):
            return jsonify({'error': 'Support access required'}), 403
        
        article = KnowledgeArticle.query.get(article_id)
        if not article:
            return jsonify({'error': 'Article not found'}), 404
        
        article.publish()
        
        # Log article publication
        ip_address, user_agent = get_client_info()
        AuditLog.log_action(
            user_id=current_user.id,
            action='article_publish',
            resource_type='knowledge_article',
            resource_id=article.id,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        return jsonify({'message': 'Article published successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Article publication failed', 'details': str(e)}), 500

# Tags endpoints
@knowledge_bp.route('/tags', methods=['GET'])
def get_tags():
    """Get all tags."""
    try:
        tags = KnowledgeTag.query.order_by(KnowledgeTag.name).all()
        return jsonify({
            'tags': [tag.to_dict() for tag in tags]
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get tags', 'details': str(e)}), 500

# Search endpoint
@knowledge_bp.route('/search', methods=['GET'])
def search_knowledge():
    """Search knowledge base."""
    try:
        query = request.args.get('q', '').strip()
        category_id = request.args.get('category_id', '').strip()
        language = request.args.get('language', '').strip()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        if not query:
            return jsonify({'error': 'Search query is required'}), 400
        
        # Search articles
        articles_query = KnowledgeArticle.search(
            query=query,
            category_id=category_id if category_id else None,
            language=language if language else None
        )
        
        articles = articles_query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'query': query,
            'articles': [article.to_dict(include_content=False) for article in articles.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': articles.total,
                'pages': articles.pages,
                'has_next': articles.has_next,
                'has_prev': articles.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Search failed', 'details': str(e)}), 500

# Statistics endpoint
@knowledge_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_knowledge_stats():
    """Get knowledge base statistics."""
    try:
        if not current_user.has_role('support'):
            return jsonify({'error': 'Support access required'}), 403
        
        total_articles = KnowledgeArticle.query.count()
        published_articles = KnowledgeArticle.query.filter_by(status='published').count()
        draft_articles = KnowledgeArticle.query.filter_by(status='draft').count()
        total_categories = KnowledgeCategory.query.filter_by(is_active=True).count()
        total_tags = KnowledgeTag.query.count()
        
        # Most viewed articles
        popular_articles = KnowledgeArticle.query.filter_by(status='published').order_by(
            KnowledgeArticle.view_count.desc()
        ).limit(5).all()
        
        return jsonify({
            'total_articles': total_articles,
            'published_articles': published_articles,
            'draft_articles': draft_articles,
            'total_categories': total_categories,
            'total_tags': total_tags,
            'popular_articles': [article.to_dict(include_content=False) for article in popular_articles]
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get knowledge stats', 'details': str(e)}), 500

