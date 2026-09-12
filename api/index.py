import os
import sys
import traceback

# Ensure backend directory is in the Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_backend = os.path.abspath(os.path.join(current_dir, '..', 'backend'))
cwd_backend = os.path.abspath(os.path.join(os.getcwd(), 'backend'))

for path in [parent_backend, cwd_backend]:
    if os.path.isdir(path) and path not in sys.path:
        sys.path.insert(0, path)

try:
    from app import create_app
    from app.models.user import db, User
    from app.models.profile import Profile, LocationPreference

    app = create_app()

    # Ensure tables exist on startup (especially on fresh cloud databases)
    with app.app_context():
        try:
            db.create_all()
            # If no users exist, seed default admin account
            if User.query.count() == 0:
                admin = User(username="admin", email="admin@withme.com", is_admin=True)
                admin.set_password("admin123")
                db.session.add(admin)
                db.session.flush()

                profile = Profile(
                    user_id=admin.id,
                    display_name="Super Administrator",
                    headline="Platform Administrator",
                    bio="WithMe system administrator"
                )
                db.session.add(profile)
                db.session.add(LocationPreference(user_id=admin.id))
                db.session.commit()
                print("Default admin created successfully: admin / admin123")
        except Exception as db_init_err:
            db.session.rollback()
            print(f"Notice: db.create_all/seed check: {db_init_err}", file=sys.stderr)

except Exception as e:
    from flask import Flask, jsonify
    err_app = Flask(__name__)
    err_msg = str(e)
    tb = traceback.format_exc()
    print(f"FATAL: Failed to initialize Flask app on Vercel: {err_msg}\n{tb}", file=sys.stderr)

    @err_app.route('/', defaults={'path': ''})
    @err_app.route('/<path:path>')
    def fallback_handler(path):
        return jsonify({
            'error': 'Backend initialization failed on Vercel',
            'detail': err_msg,
            'traceback': tb
        }), 500

    app = err_app

if __name__ == '__main__':
    app.run()
