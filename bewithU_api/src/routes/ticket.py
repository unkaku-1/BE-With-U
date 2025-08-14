from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, current_user
from sqlalchemy import or_

from src.models import db
from src.models.ticket import Ticket, TicketComment, TicketAttachment
from src.models.system import AuditLog

ticket_bp = Blueprint('tickets', __name__)

def get_client_info():
    """Get client IP and User-Agent."""
    ip_address = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
    user_agent = request.headers.get('User-Agent', '')
    return ip_address, user_agent

# Tickets endpoints
@ticket_bp.route('/', methods=['GET'])
@jwt_required()
def get_tickets():
    """Get tickets list."""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        status = request.args.get('status', '').strip()
        priority = request.args.get('priority', '').strip()
        category = request.args.get('category', '').strip()
        assignee_id = request.args.get('assignee_id', '').strip()
        search = request.args.get('search', '').strip()
        
        # Build query based on user role
        if current_user.has_role('support'):
            # Support users can see all tickets
            query = Ticket.query
        else:
            # Regular users can only see their own tickets
            query = Ticket.query.filter_by(requester_id=current_user.id)
        
        # Apply filters
        if status and status in Ticket.STATUS_CHOICES:
            query = query.filter_by(status=status)
        
        if priority and priority in Ticket.PRIORITY_CHOICES:
            query = query.filter_by(priority=priority)
        
        if category:
            query = query.filter_by(category=category)
        
        if assignee_id and current_user.has_role('support'):
            query = query.filter_by(assignee_id=assignee_id)
        
        if search:
            query = query.filter(
                or_(
                    Ticket.ticket_number.contains(search),
                    Ticket.title.contains(search),
                    Ticket.description.contains(search)
                )
            )
        
        # Paginate results
        tickets = query.order_by(Ticket.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'tickets': [ticket.to_dict() for ticket in tickets.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': tickets.total,
                'pages': tickets.pages,
                'has_next': tickets.has_next,
                'has_prev': tickets.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get tickets', 'details': str(e)}), 500

@ticket_bp.route('/<ticket_id>', methods=['GET'])
@jwt_required()
def get_ticket(ticket_id):
    """Get specific ticket."""
    try:
        ticket = Ticket.query.get(ticket_id)
        if not ticket:
            return jsonify({'error': 'Ticket not found'}), 404
        
        # Check permissions
        if not current_user.has_role('support') and ticket.requester_id != current_user.id:
            return jsonify({'error': 'Access denied'}), 403
        
        return jsonify({
            'ticket': ticket.to_dict(include_comments=True, include_attachments=True)
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get ticket', 'details': str(e)}), 500

@ticket_bp.route('/', methods=['POST'])
@jwt_required()
def create_ticket():
    """Create new ticket."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        title = data.get('title', '').strip()
        description = data.get('description', '').strip()
        priority = data.get('priority', 'normal')
        category = data.get('category', '').strip()
        
        if not title or not description:
            return jsonify({'error': 'Title and description are required'}), 400
        
        if priority not in Ticket.PRIORITY_CHOICES:
            return jsonify({'error': 'Invalid priority'}), 400
        
        ticket = Ticket(
            title=title,
            description=description,
            priority=priority,
            category=category if category else None,
            requester_id=current_user.id
        )
        
        db.session.add(ticket)
        db.session.commit()
        
        # Log ticket creation
        ip_address, user_agent = get_client_info()
        AuditLog.log_action(
            user_id=current_user.id,
            action='ticket_create',
            resource_type='ticket',
            resource_id=ticket.id,
            new_values=ticket.to_dict(),
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        return jsonify({'ticket': ticket.to_dict()}), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Ticket creation failed', 'details': str(e)}), 500

@ticket_bp.route('/<ticket_id>', methods=['PUT'])
@jwt_required()
def update_ticket(ticket_id):
    """Update ticket."""
    try:
        ticket = Ticket.query.get(ticket_id)
        if not ticket:
            return jsonify({'error': 'Ticket not found'}), 404
        
        # Check permissions
        is_requester = ticket.requester_id == current_user.id
        is_support = current_user.has_role('support')
        
        if not is_requester and not is_support:
            return jsonify({'error': 'Access denied'}), 403
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Store old values for audit
        old_values = ticket.to_dict()
        
        # Requesters can only update title and description if ticket is open
        if is_requester and not is_support:
            if ticket.status != 'open':
                return jsonify({'error': 'Cannot modify closed ticket'}), 400
            
            if 'title' in data:
                ticket.title = data['title'].strip()
            if 'description' in data:
                ticket.description = data['description'].strip()
        
        # Support users can update all fields
        if is_support:
            if 'title' in data:
                ticket.title = data['title'].strip()
            if 'description' in data:
                ticket.description = data['description'].strip()
            if 'priority' in data and data['priority'] in Ticket.PRIORITY_CHOICES:
                ticket.priority = data['priority']
            if 'category' in data:
                ticket.category = data['category'].strip() if data['category'] else None
            if 'assignee_id' in data:
                ticket.assign_to(data['assignee_id'])
        
        # Log ticket update
        ip_address, user_agent = get_client_info()
        AuditLog.log_action(
            user_id=current_user.id,
            action='ticket_update',
            resource_type='ticket',
            resource_id=ticket.id,
            old_values=old_values,
            new_values=ticket.to_dict(),
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        db.session.commit()
        
        return jsonify({'ticket': ticket.to_dict()}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Ticket update failed', 'details': str(e)}), 500

@ticket_bp.route('/<ticket_id>/resolve', methods=['POST'])
@jwt_required()
def resolve_ticket(ticket_id):
    """Resolve ticket (support only)."""
    try:
        if not current_user.has_role('support'):
            return jsonify({'error': 'Support access required'}), 403
        
        ticket = Ticket.query.get(ticket_id)
        if not ticket:
            return jsonify({'error': 'Ticket not found'}), 404
        
        ticket.resolve()
        
        # Log ticket resolution
        ip_address, user_agent = get_client_info()
        AuditLog.log_action(
            user_id=current_user.id,
            action='ticket_resolve',
            resource_type='ticket',
            resource_id=ticket.id,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        return jsonify({'message': 'Ticket resolved successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Ticket resolution failed', 'details': str(e)}), 500

@ticket_bp.route('/<ticket_id>/close', methods=['POST'])
@jwt_required()
def close_ticket(ticket_id):
    """Close ticket."""
    try:
        ticket = Ticket.query.get(ticket_id)
        if not ticket:
            return jsonify({'error': 'Ticket not found'}), 404
        
        # Check permissions - requester or support can close
        if ticket.requester_id != current_user.id and not current_user.has_role('support'):
            return jsonify({'error': 'Access denied'}), 403
        
        ticket.close()
        
        # Log ticket closure
        ip_address, user_agent = get_client_info()
        AuditLog.log_action(
            user_id=current_user.id,
            action='ticket_close',
            resource_type='ticket',
            resource_id=ticket.id,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        return jsonify({'message': 'Ticket closed successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Ticket closure failed', 'details': str(e)}), 500

@ticket_bp.route('/<ticket_id>/reopen', methods=['POST'])
@jwt_required()
def reopen_ticket(ticket_id):
    """Reopen ticket."""
    try:
        ticket = Ticket.query.get(ticket_id)
        if not ticket:
            return jsonify({'error': 'Ticket not found'}), 404
        
        # Check permissions - requester or support can reopen
        if ticket.requester_id != current_user.id and not current_user.has_role('support'):
            return jsonify({'error': 'Access denied'}), 403
        
        ticket.reopen()
        
        # Log ticket reopening
        ip_address, user_agent = get_client_info()
        AuditLog.log_action(
            user_id=current_user.id,
            action='ticket_reopen',
            resource_type='ticket',
            resource_id=ticket.id,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        return jsonify({'message': 'Ticket reopened successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Ticket reopening failed', 'details': str(e)}), 500

# Comments endpoints
@ticket_bp.route('/<ticket_id>/comments', methods=['POST'])
@jwt_required()
def add_comment(ticket_id):
    """Add comment to ticket."""
    try:
        ticket = Ticket.query.get(ticket_id)
        if not ticket:
            return jsonify({'error': 'Ticket not found'}), 404
        
        # Check permissions
        if ticket.requester_id != current_user.id and not current_user.has_role('support'):
            return jsonify({'error': 'Access denied'}), 403
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        content = data.get('content', '').strip()
        is_internal = data.get('is_internal', False)
        
        if not content:
            return jsonify({'error': 'Comment content is required'}), 400
        
        # Only support users can create internal comments
        if is_internal and not current_user.has_role('support'):
            is_internal = False
        
        comment = TicketComment(
            ticket_id=ticket.id,
            author_id=current_user.id,
            content=content,
            is_internal=is_internal
        )
        
        db.session.add(comment)
        db.session.commit()
        
        # Log comment creation
        ip_address, user_agent = get_client_info()
        AuditLog.log_action(
            user_id=current_user.id,
            action='comment_create',
            resource_type='ticket_comment',
            resource_id=comment.id,
            new_values=comment.to_dict(),
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        return jsonify({'comment': comment.to_dict()}), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Comment creation failed', 'details': str(e)}), 500

# Statistics endpoint
@ticket_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_ticket_stats():
    """Get ticket statistics."""
    try:
        if current_user.has_role('support'):
            # Support users see all tickets
            total_tickets = Ticket.query.count()
            open_tickets = Ticket.query.filter_by(status='open').count()
            pending_tickets = Ticket.query.filter_by(status='pending').count()
            resolved_tickets = Ticket.query.filter_by(status='resolved').count()
            closed_tickets = Ticket.query.filter_by(status='closed').count()
            
            # Tickets by priority
            high_priority = Ticket.query.filter_by(priority='high').filter(
                Ticket.status.in_(['open', 'pending'])
            ).count()
            urgent_priority = Ticket.query.filter_by(priority='urgent').filter(
                Ticket.status.in_(['open', 'pending'])
            ).count()
            
            # My assigned tickets
            my_assigned = Ticket.query.filter_by(assignee_id=current_user.id).filter(
                Ticket.status.in_(['open', 'pending'])
            ).count()
            
            return jsonify({
                'total_tickets': total_tickets,
                'open_tickets': open_tickets,
                'pending_tickets': pending_tickets,
                'resolved_tickets': resolved_tickets,
                'closed_tickets': closed_tickets,
                'high_priority_tickets': high_priority,
                'urgent_priority_tickets': urgent_priority,
                'my_assigned_tickets': my_assigned
            }), 200
        else:
            # Regular users see only their tickets
            my_tickets = Ticket.query.filter_by(requester_id=current_user.id)
            total_tickets = my_tickets.count()
            open_tickets = my_tickets.filter_by(status='open').count()
            pending_tickets = my_tickets.filter_by(status='pending').count()
            resolved_tickets = my_tickets.filter_by(status='resolved').count()
            closed_tickets = my_tickets.filter_by(status='closed').count()
            
            return jsonify({
                'my_total_tickets': total_tickets,
                'my_open_tickets': open_tickets,
                'my_pending_tickets': pending_tickets,
                'my_resolved_tickets': resolved_tickets,
                'my_closed_tickets': closed_tickets
            }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get ticket stats', 'details': str(e)}), 500

# Categories endpoint
@ticket_bp.route('/categories', methods=['GET'])
@jwt_required()
def get_ticket_categories():
    """Get available ticket categories."""
    try:
        # This could be made configurable via system settings
        categories = [
            'ハードウェア',
            'ソフトウェア',
            'ネットワーク',
            'アカウント',
            'セキュリティ',
            'その他'
        ]
        
        return jsonify({'categories': categories}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get categories', 'details': str(e)}), 500

