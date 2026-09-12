import time
from flask import Flask, jsonify, request, g
from flask_cors import CORS
from flask_migrate import Migrate
from sqlalchemy import event
from .config import Config
from .models.user import db

migrate = Migrate()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # SQLite WAL & Performance PRAGMA Listener
    with app.app_context():
        @event.listens_for(db.engine, "connect")
        def set_sqlite_pragma(dbapi_connection, connection_record):
            if "sqlite" in str(app.config.get("SQLALCHEMY_DATABASE_URI", "")):
                cursor = dbapi_connection.cursor()
                cursor.execute("PRAGMA journal_mode=WAL")
                cursor.execute("PRAGMA synchronous=NORMAL")
                cursor.execute("PRAGMA cache_size=-64000")
                cursor.execute("PRAGMA temp_store=MEMORY")
                cursor.close()

    # Request Performance Monitoring Middleware
    @app.before_request
    def record_start_time():
        g.start_time = time.time()

    @app.after_request
    def record_response_time(response):
        if hasattr(g, 'start_time'):
            duration_ms = (time.time() - g.start_time) * 1000
            response.headers['X-Response-Time-Ms'] = f"{duration_ms:.2f}"
            if duration_ms > 500:
                app.logger.warning(f"SLOW REQUEST: [{response.status_code}] {request.method} {request.path} took {duration_ms:.2f}ms")
        return response

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
    from .routes.upload_routes import upload_bp

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
    app.register_blueprint(upload_bp)

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
        import traceback
        trace = traceback.format_exc()
        app.logger.error(f"INTERNAL SERVER ERROR: {e}\n{trace}")
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e),
            'trace': trace if app.debug else None
        }), 500

    return app
