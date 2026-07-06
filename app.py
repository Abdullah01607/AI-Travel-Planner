import os
from flask import Flask, request, jsonify, send_from_directory
from dotenv import load_dotenv
import requests

# Load environment variables from .env
load_dotenv()

app = Flask(__name__)

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/style.css')
def style():
    return send_from_directory('.', 'style.css')

@app.route('/main.js')
def main_js():
    return send_from_directory('.', 'main.js')

@app.route('/assets/<path:filename>')
def assets(filename):
    return send_from_directory('assets', filename)

@app.route('/api/generate', methods=['POST'])
def generate_itinerary():
    try:
        data = request.get_json() or {}
        
        # Extract and validate form inputs
        destination = data.get('destination')
        start_date = data.get('startDate')
        end_date = data.get('endDate')
        duration = data.get('duration')
        travelers = data.get('travelers')
        budget = data.get('budget')
        travel_style = data.get('travelStyle')
        interests = data.get('interests', [])

        if not all([destination, start_date, end_date, duration, travelers, budget, travel_style]):
            return jsonify({"error": "Missing required planning parameters."}), 400

        # Load Groq configuration
        groq_api_key = os.getenv("GROQ_API_KEY")
        groq_base_url = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1").rstrip('/')
        model = os.getenv("MODEL", "llama-3.3-70b-versatile")

        # Basic check for API key
        if not groq_api_key or groq_api_key == "your_api_key_here":
            return jsonify({
                "error": "GROQ_API_KEY is not configured. Please add your key to the .env file."
            }), 500

        # Construct prompt
        prompt = f"""
Generate a detailed, highly personalized day-by-day travel itinerary for:
- Destination: {destination}
- Duration: {duration} days
- Group Size: {travelers} traveler(s)
- Dates: From {start_date} to {end_date}
- Budget Category: {budget.capitalize()}
- Travel Style: {travel_style.capitalize()}
- Specific Interests: {", ".join(interests) if interests else "General sightseeing"}

Please structure your response in Markdown using the following formatting rules to ensure a premium look:
1. Start directly with a main `# [Destination] Travel Itinerary` title.
2. Group the schedule day-by-day using `### Day X: [Name of Highlight]` headers.
3. Use bullet points (`-`) for specific activities under Morning, Afternoon, and Evening subheadings.
4. Add relevant emojis throughout the text for visual appeal (e.g., ✈️, 🗺️, 🍜, 🏛️, 🛍️, 🚊).
5. State realistic estimated costs (in local currency or USD) for attractions, meals, and transport.
6. Provide a section at the bottom titled `### 💡 RoamAI Travel Tips` with practical advice on local customs, transit options, and weather.
7. Return ONLY the markdown itinerary. Do NOT include conversational filler text like "Sure, here is your itinerary..." or "Hope you have a good trip!".
"""

        # Prepare OpenAI-compatible API request
        headers = {
            "Authorization": f"Bearer {groq_api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": model,
            "messages": [
                {
                    "role": "system",
                    "content": "You are a professional travel agent. You write detailed, organized travel itineraries in beautiful Markdown without conversational introductory or concluding chat filler."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.7,
            "max_tokens": 4000
        }

        # Make API Request
        response = requests.post(
            f"{groq_base_url}/chat/completions",
            json=payload,
            headers=headers,
            timeout=30
        )

        if response.status_code != 200:
            is_json = 'application/json' in response.headers.get('Content-Type', '')
            error_data = response.json() if is_json else {}
            error_msg = error_data.get('error', {}).get('message', response.text)
            return jsonify({"error": f"Groq API Error: {error_msg}"}), response.status_code

        response_data = response.json()
        itinerary = response_data['choices'][0]['message']['content']

        return jsonify({
            "success": True,
            "itinerary": itinerary
        })

    except requests.exceptions.Timeout:
        return jsonify({"error": "Request to the Groq API timed out. Please try again."}), 504
    except Exception as e:
        return jsonify({"error": f"An unexpected server error occurred: {str(e)}"}), 500

if __name__ == '__main__':
    # Run locally on port 8000
    app.run(host='127.0.0.1', port=8000, debug=True)
