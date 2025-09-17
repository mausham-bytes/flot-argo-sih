from flask import Flask
from flask_cors import CORS
from routes.chat import chat_bp

def create_app():
    app = Flask(__name__)
    
    # Enable CORS (allow React frontend to connect)
    CORS(app, resources={r"/*": {"origins": "*"}})

    # Enable CORS with all origins allowed
    CORS(app, resources={r"/*": {"origins": "*"}})

    # Register Blueprints
    app.register_blueprint(chat_bp, url_prefix="/chat")

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=True)
