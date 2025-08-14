from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, current_user
import requests
import json

from src.models import db
from src.models.chat import ChatConversation, ChatMessage, ChatTemplate
from src.models.knowledge import KnowledgeArticle
from src.models.system import AuditLog, SystemSetting

chat_bp = Blueprint('chat', __name__)

def get_client_info():
    """Get client IP and User-Agent."""
    ip_address = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
    user_agent = request.headers.get('User-Agent', '')
    return ip_address, user_agent

def search_knowledge_base(query, language='ja'):
    """Search knowledge base for relevant information."""
    try:
        # Search published articles
        articles = KnowledgeArticle.search(
            query=query,
            language=language,
            status='published'
        ).limit(3).all()
        
        results = []
        for article in articles:
            results.append({
                'id': article.id,
                'title': article.title,
                'summary': article.summary,
                'content_preview': article.content[:200] + '...' if len(article.content) > 200 else article.content,
                'url': f'/knowledge/articles/{article.id}'
            })
        
        return results
    except Exception as e:
        print(f"Knowledge search error: {e}")
        return []

def call_ollama_api(messages, model=None):
    """Call Ollama API for LLM response."""
    try:
        ollama_url = SystemSetting.get_setting('ollama_base_url', 'http://localhost:11434')
        model = model or SystemSetting.get_setting('default_llm_model', 'llama2')
        
        # Format messages for Ollama
        formatted_messages = []
        for msg in messages:
            formatted_messages.append({
                'role': msg['role'],
                'content': msg['content']
            })
        
        payload = {
            'model': model,
            'messages': formatted_messages,
            'stream': False
        }
        
        response = requests.post(
            f"{ollama_url}/api/chat",
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            return result.get('message', {}).get('content', 'Sorry, I could not generate a response.')
        else:
            return f"Error: LLM service returned status {response.status_code}"
            
    except requests.exceptions.RequestException as e:
        return f"Error: Could not connect to LLM service - {str(e)}"
    except Exception as e:
        return f"Error: {str(e)}"

# Conversations endpoints
@chat_bp.route('/conversations', methods=['GET'])
@jwt_required()
def get_conversations():
    """Get user's chat conversations."""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        conversations = ChatConversation.query.filter_by(
            user_id=current_user.id,
            is_active=True
        ).order_by(ChatConversation.updated_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'conversations': [conv.to_dict() for conv in conversations.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': conversations.total,
                'pages': conversations.pages,
                'has_next': conversations.has_next,
                'has_prev': conversations.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get conversations', 'details': str(e)}), 500

@chat_bp.route('/conversations', methods=['POST'])
@jwt_required()
def create_conversation():
    """Create new chat conversation."""
    try:
        data = request.get_json()
        title = data.get('title', '') if data else ''
        
        conversation = ChatConversation(
            user_id=current_user.id,
            title=title.strip() if title else None
        )
        
        db.session.add(conversation)
        db.session.commit()
        
        # Log conversation creation
        ip_address, user_agent = get_client_info()
        AuditLog.log_action(
            user_id=current_user.id,
            action='conversation_create',
            resource_type='chat_conversation',
            resource_id=conversation.id,
            new_values=conversation.to_dict(),
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        return jsonify({'conversation': conversation.to_dict()}), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Conversation creation failed', 'details': str(e)}), 500

@chat_bp.route('/conversations/<conversation_id>', methods=['GET'])
@jwt_required()
def get_conversation(conversation_id):
    """Get specific conversation with messages."""
    try:
        conversation = ChatConversation.query.filter_by(
            id=conversation_id,
            user_id=current_user.id
        ).first()
        
        if not conversation:
            return jsonify({'error': 'Conversation not found'}), 404
        
        return jsonify({
            'conversation': conversation.to_dict(include_messages=True)
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get conversation', 'details': str(e)}), 500

@chat_bp.route('/conversations/<conversation_id>', methods=['DELETE'])
@jwt_required()
def delete_conversation(conversation_id):
    """Delete (archive) conversation."""
    try:
        conversation = ChatConversation.query.filter_by(
            id=conversation_id,
            user_id=current_user.id
        ).first()
        
        if not conversation:
            return jsonify({'error': 'Conversation not found'}), 404
        
        conversation.archive()
        
        # Log conversation deletion
        ip_address, user_agent = get_client_info()
        AuditLog.log_action(
            user_id=current_user.id,
            action='conversation_delete',
            resource_type='chat_conversation',
            resource_id=conversation.id,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        return jsonify({'message': 'Conversation archived successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Conversation deletion failed', 'details': str(e)}), 500

# Messages endpoints
@chat_bp.route('/conversations/<conversation_id>/messages', methods=['POST'])
@jwt_required()
def send_message(conversation_id):
    """Send message and get AI response."""
    try:
        conversation = ChatConversation.query.filter_by(
            id=conversation_id,
            user_id=current_user.id
        ).first()
        
        if not conversation:
            return jsonify({'error': 'Conversation not found'}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        content = data.get('content', '').strip()
        if not content:
            return jsonify({'error': 'Message content is required'}), 400
        
        # Create user message
        user_message = ChatMessage.create_message(
            conversation_id=conversation.id,
            role='user',
            content=content
        )
        
        # Search knowledge base first
        knowledge_results = search_knowledge_base(content, current_user.language)
        
        # Prepare context for AI
        system_prompt = f"""You are BEwithU, an intelligent IT support assistant. You help users with IT-related questions and problems.

Current user language: {current_user.language}
Please respond in the user's language.

If you find relevant information in the knowledge base, use it to provide accurate answers.
If you cannot find relevant information, politely explain that you need to create a support ticket for human assistance.

Knowledge base search results for "{content}":
"""
        
        if knowledge_results:
            system_prompt += "\nRelevant articles found:\n"
            for result in knowledge_results:
                system_prompt += f"- {result['title']}: {result['summary']}\n"
                system_prompt += f"  Preview: {result['content_preview']}\n\n"
        else:
            system_prompt += "\nNo relevant articles found in the knowledge base.\n"
        
        system_prompt += """
Based on the above information, please provide a helpful response. If you can answer the question using the knowledge base, do so. If not, suggest creating a support ticket for human assistance.
"""
        
        # Get conversation history for context
        recent_messages = ChatMessage.query.filter_by(
            conversation_id=conversation.id
        ).order_by(ChatMessage.created_at.desc()).limit(10).all()
        
        # Prepare messages for LLM
        llm_messages = [{'role': 'system', 'content': system_prompt}]
        
        # Add recent conversation history (in reverse order)
        for msg in reversed(recent_messages[1:]):  # Skip the just-created user message
            llm_messages.append({
                'role': msg.role,
                'content': msg.content
            })
        
        # Add current user message
        llm_messages.append({
            'role': 'user',
            'content': content
        })
        
        # Get AI response
        ai_response = call_ollama_api(llm_messages)
        
        # Create assistant message
        assistant_message = ChatMessage.create_message(
            conversation_id=conversation.id,
            role='assistant',
            content=ai_response,
            metadata={
                'knowledge_results': knowledge_results,
                'model_used': SystemSetting.get_setting('default_llm_model', 'llama2'),
                'has_knowledge_match': len(knowledge_results) > 0
            }
        )
        
        # Log chat interaction
        ip_address, user_agent = get_client_info()
        AuditLog.log_action(
            user_id=current_user.id,
            action='chat_message',
            resource_type='chat_message',
            resource_id=user_message.id,
            new_values={
                'user_message': user_message.to_dict(),
                'assistant_message': assistant_message.to_dict()
            },
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        return jsonify({
            'user_message': user_message.to_dict(),
            'assistant_message': assistant_message.to_dict(),
            'knowledge_results': knowledge_results
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Message sending failed', 'details': str(e)}), 500

# Templates endpoints
@chat_bp.route('/templates', methods=['GET'])
@jwt_required()
def get_chat_templates():
    """Get chat templates."""
    try:
        if not current_user.has_role('support'):
            return jsonify({'error': 'Support access required'}), 403
        
        templates = ChatTemplate.query.filter_by(is_active=True).order_by(
            ChatTemplate.category, ChatTemplate.name
        ).all()
        
        return jsonify({
            'templates': [template.to_dict() for template in templates]
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get templates', 'details': str(e)}), 500

@chat_bp.route('/templates', methods=['POST'])
@jwt_required()
def create_chat_template():
    """Create chat template (support only)."""
    try:
        if not current_user.has_role('support'):
            return jsonify({'error': 'Support access required'}), 403
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        name = data.get('name', '').strip()
        description = data.get('description', '').strip()
        category = data.get('category', '').strip()
        template_content = data.get('template_content', '').strip()
        variables = data.get('variables', [])
        
        if not name or not template_content:
            return jsonify({'error': 'Name and template content are required'}), 400
        
        template = ChatTemplate(
            name=name,
            description=description,
            category=category,
            template_content=template_content,
            variables=variables,
            created_by=current_user.id
        )
        
        db.session.add(template)
        db.session.commit()
        
        return jsonify({'template': template.to_dict()}), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Template creation failed', 'details': str(e)}), 500

# Statistics endpoint
@chat_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_chat_stats():
    """Get chat statistics."""
    try:
        if current_user.has_role('support'):
            # Support users see system-wide stats
            total_conversations = ChatConversation.query.filter_by(is_active=True).count()
            total_messages = ChatMessage.query.count()
            active_conversations = ChatConversation.query.filter_by(is_active=True).filter(
                ChatConversation.updated_at >= db.func.date_sub(db.func.now(), db.text('INTERVAL 7 DAY'))
            ).count()
            
            return jsonify({
                'total_conversations': total_conversations,
                'total_messages': total_messages,
                'active_conversations_week': active_conversations
            }), 200
        else:
            # Regular users see their own stats
            my_conversations = ChatConversation.query.filter_by(
                user_id=current_user.id,
                is_active=True
            ).count()
            
            my_messages = ChatMessage.query.join(ChatConversation).filter(
                ChatConversation.user_id == current_user.id,
                ChatMessage.role == 'user'
            ).count()
            
            return jsonify({
                'my_conversations': my_conversations,
                'my_messages': my_messages
            }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get chat stats', 'details': str(e)}), 500

# Knowledge search endpoint
@chat_bp.route('/search-knowledge', methods=['POST'])
@jwt_required()
def search_knowledge():
    """Search knowledge base for chat context."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        query = data.get('query', '').strip()
        if not query:
            return jsonify({'error': 'Search query is required'}), 400
        
        results = search_knowledge_base(query, current_user.language)
        
        return jsonify({
            'query': query,
            'results': results,
            'found': len(results) > 0
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Knowledge search failed', 'details': str(e)}), 500

