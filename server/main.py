import json
from flask import (Flask, request, make_response, jsonify, redirect)


app = Flask(__name__)


@app.route('/sample')
def index():
	data = {"response_data": [
		{'name': 'Pop', 'age': 12, 'school': 'James Wood High'},
		{'name': 'Kilo', 'age': 12, 'school': 'James Wood High'},
		{'name': 'Mondy', 'age': 7, 'school': 'Darrern Loo Junior'},
	]}
	return jsonify(data)


@app.route('/save', methods=["POST"])
def save():
	data = {
		'concept': json.loads(request.form['concept']),
		'original': json.loads(request.form['original']),
		'refined': json.loads(request.form['refined']),
	}

	return jsonify({'response': data})


if __name__ == '__main__':
	app.run(debug=True, host='0.0.0.0')