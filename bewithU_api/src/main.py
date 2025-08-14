import os
import sys
from datetime import datetime, timezone

# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from werkzeug.exceptions import HTTPException

from src.config import config
from src.models import init_db
from src.models.user import User, UserSession

def create_app(config_name=None):
    """Application factory pattern."""
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')
    
    app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
    
    # Load configuration
    app.config.from_object(config[config_name])
    config[config_name].init_app(app)
    
    # Initialize extensions
    CORS(app, origins=app.config['CORS_ORIGINS'])
    jwt = JWTManager(app)
    
    # Initialize database
    db = init_db(app)
    
    # JWT configuration
    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        """Check if JWT token is revoked."""
        jti = jwt_payload['jti']
        # Check if token exists in database and is not expired
        session = UserSession.query.filter_by(token_hash=jti).first()
        return session is None or session.is_expired()
    
    @jwt.user_identity_loader
    def user_identity_lookup(user):
        """Return user identity for JWT."""
        return user.id if hasattr(user, 'id') else user
    
    @jwt.user_lookup_loader
    def user_lookup_callback(_jwt_header, jwt_data):
        """Load user from JWT."""
        identity = jwt_data["sub"]
        return User.query.get(identity)
    
    # Error handlers
    @app.errorhandler(HTTPException)
    def handle_exception(e):
        """Return JSON instead of HTML for HTTP errors."""
        return jsonify({
            "error": e.name,
            "message": e.description,
            "status_code": e.code
        }), e.code
    
    @app.errorhandler(404)
    def not_found(error):
        """Handle 404 errors."""
        return jsonify({
            "error": "Not Found",
            "message": "The requested resource was not found",
            "status_code": 404
        }), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        """Handle 500 errors."""
        return jsonify({
            "error": "Internal Server Error",
            "message": "An internal server error occurred",
            "status_code": 500
        }), 500
    
    # Health check endpoint
    @app.route('/api/health')
    def health_check():
        """Health check endpoint."""
        return jsonify({
            "status": "healthy",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "version": "1.0.0",
            "environment": config_name
        })
    
    # API info endpoint
    @app.route('/api/info')
    def api_info():
        """API information endpoint."""
        return jsonify({
            "name": "BEwithU API",
            "version": "1.0.0",
            "description": "Intelligent IT Support System API",
            "environment": config_name,
            "endpoints": {
                "auth": "/api/auth",
                "users": "/api/users",
                "knowledge": "/api/knowledge",
                "tickets": "/api/tickets",
                "chat": "/api/chat",
                "system": "/api/system"
            }
        })
    
    # Register blueprints
    from src.routes.auth import auth_bp
    from src.routes.user import user_bp
    from src.routes.knowledge import knowledge_bp
    from src.routes.ticket import ticket_bp
    from src.routes.chat import chat_bp
    from src.routes.system import system_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(user_bp, url_prefix='/api/users')
    app.register_blueprint(knowledge_bp, url_prefix='/api/knowledge')
    app.register_blueprint(ticket_bp, url_prefix='/api/tickets')
    app.register_blueprint(chat_bp, url_prefix='/api/chat')
    app.register_blueprint(system_bp, url_prefix='/api/system')
    
    # Serve frontend
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve(path):
        """Serve frontend application."""
        static_folder_path = app.static_folder
        if static_folder_path is None:
            return jsonify({"error": "Static folder not configured"}), 404

        if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
            return send_from_directory(static_folder_path, path)
        else:
            index_path = os.path.join(static_folder_path, 'index.html')
            if os.path.exists(index_path):
                return send_from_directory(static_folder_path, 'index.html')
            else:
                return jsonify({
                    "message": "BEwithU API is running",
                    "frontend": "Not deployed",
                    "api_docs": "/api/info"
                })
    
    # Create database tables
    with app.app_context():
        db.create_all()
        
        # Create default admin user if not exists
        admin_user = User.query.filter_by(username='admin').first()
        if not admin_user:
            admin_user = User.create_user(
                username='admin',
                email='admin@bewithU.local',
                password='admin123',
                display_name='System Administrator',
                role='admin',
                language='ja'
            )
            print(f"Created default admin user: {admin_user.username}")
        
        # Initialize system settings
        from src.models.system import SystemSetting
        default_settings = [
            ('site_name', 'BEwithU', 'Site name', 'string', True),
            ('site_description', 'Intelligent IT Support System', 'Site description', 'string', True),
            ('default_language', 'ja', 'Default system language', 'string', True),
            ('max_file_size', '10485760', 'Maximum file upload size in bytes (10MB)', 'integer', False),
            ('session_timeout', '86400', 'Session timeout in seconds (24 hours)', 'integer', False),
            ('enable_registration', 'false', 'Allow user registration', 'boolean', True),
        ]
        
        for key, value, description, data_type, is_public in default_settings:
            if not SystemSetting.query.get(key):
                SystemSetting.set_setting(key, value, description, data_type, is_public)
    
    return app

# Create app instance
app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

