from flask import Flask, jsonify
from flask_cors import CORS
from .config import Config
from .models.user import db

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Register blueprints
    from .routes.auth_routes import auth_bp
    from .routes.user_routes import user_bp
    from .routes.discover_routes import discover_bp
    from .routes.nearby_routes import nearby_bp
    from .routes.connection_routes import connection_bp
    from .routes.message_routes import message_bp
    from .routes.activity_routes import activity_bp
    from .routes.project_routes import project_bp
    from .routes.group_routes import group_bp
    from .routes.notification_routes import notification_bp
    from .routes.safety_routes import safety_bp
    from .routes.search_routes import search_bp
    from .routes.admin_routes import admin_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(discover_bp)
    app.register_blueprint(nearby_bp)
    app.register_blueprint(connection_bp)
    app.register_blueprint(message_bp)
    app.register_blueprint(activity_bp)
    app.register_blueprint(project_bp)
    app.register_blueprint(group_bp)
    app.register_blueprint(notification_bp)
    app.register_blueprint(safety_bp)
    app.register_blueprint(search_bp)
    app.register_blueprint(admin_bp)

    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'application': 'WithMe API',
            'version': '1.0.0'
        }), 200

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'error': 'Resource not found'}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({'error': 'Internal server error'}), 500

    with app.app_context():
        db.create_all()

    return app
