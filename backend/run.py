import os
from app import create_app

app = create_app()

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'False').lower() in ['true', '1', 't']
    use_waitress = os.getenv('USE_WAITRESS', 'False').lower() in ['true', '1', 't']

    if use_waitress or not debug:
        try:
            from waitress import serve
            print(f"[WSGI] WithMe Production Server (Waitress) running on http://127.0.0.1:{port} with 8 threads")
            serve(app, host='0.0.0.0', port=port, threads=8)
        except ImportError:
            print(f"[DEV] WithMe Server running on http://127.0.0.1:{port} (threaded)")
            app.run(host='0.0.0.0', port=port, debug=debug, threaded=True)
    else:
        print(f"[DEV] WithMe Server running on http://127.0.0.1:{port} (threaded)")
        app.run(host='0.0.0.0', port=port, debug=debug, threaded=True)
