# AI Chat App

A simple web-based chat application that uses OpenRouter API to interact with various Large Language Models (LLMs).

## Features
- Real-time chat interface
- Integration with OpenRouter API
- Support for multiple LLM models
- Clean and responsive UI
- Async backend processing

## Tech Stack
- FastAPI - Backend framework
- Python 3.11+ 
- Jinja2 - Template engine
- HTML/CSS/JavaScript - Frontend
- OpenRouter API - LLM provider

## Setup Instructions

1. Clone the repository
```bash
git clone <repository-url>
cd ai-chat-app
```

2. Create and activate virtual environment
```bash
python -m venv venv
source venv/bin/activate  # For Unix/MacOS
# or
venv\Scripts\activate  # For Windows
```

3. Install dependencies
```bash
pip install fastapi uvicorn python-dotenv httpx jinja2 python-multipart
```

4. Create .env file in project root
```bash
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

5. Run the application
```bash
uvicorn main:app --reload --port 8000
```

The application will be available at http://localhost:8000

## Project Structure
```text
ai-chat-app/
├── main.py          # FastAPI application
├── .env             # Environment variables
├── templates/       # HTML templates
│   └── chat.html    # Chat interface
└── static/          # Static files (if any)
```

## API Configuration
The application uses OpenRouter's API to access various LLM models. Current configuration uses:
1. Model: meta-llama/llama-3.2-3b-instruct:free
2. Temperature: 0.7
3. Top P: 1
4. Other parameters configurable in main.py

## Usage
1. Start the server
2. Open browser to http://localhost:8000
3. Type message in the chat input
4. Receive AI responses through OpenRouter API

## Development
- Use --reload flag with uvicorn for development
- Modify templates/chat.html for UI changes
- Update main.py for backend logic changes