import os
# pyrefly: ignore [missing-import]
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
        system_prompt = (
            "You are a professional travel agent. You write detailed, organized travel itineraries. "
            "You MUST respond ONLY with a JSON object. The JSON object must match this schema exactly:\n"
            "{\n"
            '  "destination": "Name of the destination",\n'
            '  "duration": number_of_days,\n'
            '  "days": [\n'
            "    {\n"
            '      "dayNumber": 1,\n'
            '      "dayTitle": "Title of the day theme",\n'
            '      "morning": "Detailed activities for morning (use rich descriptions with emojis)",\n'
            '      "afternoon": "Detailed activities for afternoon (use rich descriptions with emojis)",\n'
            '      "evening": "Detailed activities for evening (use rich descriptions with emojis)",\n'
            '      "restaurants": ["Restaurant name (description) - Price tier", "Restaurant name (description) - Price tier"],\n'
            '      "estimatedDailyCost": "$X USD equivalent",\n'
            '      "travelTips": "Specific cultural, transit or safety advice for this day"\n'
            "    }\n"
            "  ],\n"
            '  "generalTips": [\n'
            '    "Tip 1...",\n'
            '    "Tip 2..."\n'
            "  ]\n"
            "}\n"
            "Do not output any text before or after the JSON."
        )

        user_prompt = f"""
Generate a detailed, highly personalized travel itinerary for:
- Destination: {destination}
- Duration: {duration} days
- Group Size: {travelers} traveler(s)
- Dates: From {start_date} to {end_date}
- Budget Category: {budget.capitalize()}
- Travel Style: {travel_style.capitalize()}
- Specific Interests: {", ".join(interests) if interests else "General sightseeing"}
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
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": user_prompt
                }
            ],
            "response_format": {"type": "json_object"},
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
        itinerary_content = response_data['choices'][0]['message']['content']

        # Parse the JSON string to return a clean object
        import json
        try:
            itinerary = json.loads(itinerary_content)
        except Exception as e:
            # Fallback in case JSON is malformed
            itinerary = {"error_parsing": True, "raw": itinerary_content}

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
