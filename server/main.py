import json
import base64
from flask import (Flask, request, make_response, jsonify, 
                   redirect, render_template, url_for, session)
from uuid import uuid1
from pymongo import MongoClient


app = Flask(__name__)

SESSION_KEY    = 'browsing_graph'
app.secret_key = 'insalku82ns02sjans1d6xs3'

client       = MongoClient()
db           = client.bgraph_db
col_concepts = db.concepts

_isAuthenticated = lambda : SESSION_KEY in session

@app.route('/is_authenticated', methods=['GET'])
def isAuthenticated():
    return jsonify({'user_authenticated': _isAuthenticated()})


@app.route('/fb_login', methods=['POST'])
def fbLogin():

    user_id = json.loads(request.form['user_id'])
    email   = json.loads(request.form['email'])
    referer = json.loads(request.form['referer'])

    session[SESSION_KEY] = str(uuid1())

    return jsonify({'fb_login_done': True})


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

@app.route('/login', methods=['GET'])
def loginPage():
    return render_template('save_concept.html')


@app.route('/view/<uid>', methods=['GET'])
def view(uid):
    data = col_concepts.find_one({'id': uid})

    return render_template('views/view.html', data=data, 
                           original=base64.b64encode(
                                        json.dumps(data['original'])),
                           refined=base64.b64encode(
                                        json.dumps(data['refined'])))


@app.route('/view_list/<uid>', methods=['GET'])
def viewList(uid):
    data = col_concepts.find_one({'id': uid})

    return render_template('views/view_list.html', data=data, 
                           original=base64.b64encode(
                                        json.dumps(data['original'])),
                           refined=base64.b64encode(
                                        json.dumps(data['refined'])))


@app.route('/all_concepts', methods=['GET'])
def all_concepts():
    
    """
    if 'yemyat_site' in session:
        print 'Found session => ', session['yemyat_site']
    else:
        session['yemyat_site'] = "hello_world"
    """

    data = []
    for concept in col_concepts.find():
        data.append(concept)

    return render_template('all_concepts.html', data=data)


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')