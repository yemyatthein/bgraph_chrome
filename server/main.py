import json
from flask import (Flask, request, make_response, jsonify, 
                   redirect, render_template, url_for)
from uuid import uuid1
from pymongo import MongoClient


app = Flask(__name__)

client       = MongoClient()
db           = client.bgraph_db
col_concepts = db.concepts


@app.route('/save', methods=['POST'])
def save():
    concept = {
        'id'        : str(uuid1()),
        'concept'   : json.loads(request.form['concept']),
        'original'  : json.loads(request.form['original']),
        'refined'   : json.loads(request.form['refined']),
    }

    col_concepts.insert(concept, check_keys=False)

    return jsonify({'concept_id': concept['id']})


@app.route('/view/<uid>', methods=['GET'])
def view(uid):
    data = col_concepts.find_one({'id': uid})

    return render_template('views/view.html', data=data, 
                           original=json.dumps(data['original']))

@app.route('/all_concepts', methods=['GET'])
def all_concepts():
    data = []
    for concept in col_concepts.find():
        data.append(concept)

    return render_template('all_concepts.html', data=data)


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')