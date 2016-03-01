import json
import os
import base64
from flask import (Flask, request, make_response, jsonify, 
                   redirect, render_template, url_for, session)
from uuid import uuid1
from functools import wraps
from pymongo import MongoClient


app = Flask(__name__)

SESSION_KEY     = 'browsing_graph'
SESSION_KEY_UID = 'browsing_graph_user_id'
ALLOWED_USERS   = set(('10153903990522356',))
SECRET_KEY      = 'insalku82ns02sjans1d6xs3'

username = None
password = None

lines = []
with open('server/auth.data', 'r') as f:
    for l in f:
        lines.append(l[:-1])

assert len(lines) == 2

username = lines[0]
password = lines[1]

# LOCAL MongoDB
#client       = MongoClient()
#db           = client.bgraph_db

# MongoLab
connection = MongoClient("ds019628.mlab.com", 19628)
db = connection["bgraph"]
db.authenticate(username, password)

col_concepts = db.concepts
col_users    = db.users


_isAuthenticated = lambda : SESSION_KEY in session


def _checkAuthenticated():
    if not _isAuthenticated():
        return redirect(url_for('loginPage') + "?referer=/")


def _getUser(user_id):
    return col_users.find_one({'user_id': user_id})


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not _isAuthenticated():
            return redirect(url_for('loginPage') + "?referer=/")
        return f(*args, **kwargs)
    return decorated_function


@app.route('/is_authenticated', methods=['GET'])
def isAuthenticated():
    return jsonify({'user_authenticated': _isAuthenticated()})


# View Functions
# ---------------------------------------

@app.route('/', methods=['GET'])
def index():
    if _isAuthenticated():
        return redirect(url_for('all_concepts'))
    return redirect(url_for('loginPage') + "?referer=/")


@app.route('/fb_login', methods=['POST'])
def fbLogin():

    user_id = json.loads(request.form['user_id'])
    email   = json.loads(request.form['email'])

    session[SESSION_KEY]     = str(uuid1())
    session[SESSION_KEY_UID] = user_id

    user = {
        'user_id' : user_id,
        'email'   : email,
        'allowed' : user_id in ALLOWED_USERS
    }

    if not _getUser(user_id):
        col_users.insert(user, check_keys=False)

    return jsonify({'fb_login_done': True})


@app.route('/save', methods=['POST'])
def save():
    
    # TODO: what if not authenticated?
    user = _getUser(session[SESSION_KEY_UID])

    concept = {
        'id'        : str(uuid1()),
        'user_id'   : user['user_id'],
        'concept'   : json.loads(request.form['concept']),
        'original'  : json.loads(request.form['original']),
        'refined'   : json.loads(request.form['refined']),
        'indexes'   : json.loads(request.form['indexes']),
    }

    col_concepts.insert(concept, check_keys=False)

    return jsonify({'concept_id': concept['id']})

@app.route('/login', methods=['GET'])
def loginPage():
    return render_template('login.html')


@app.route('/logout', methods=['GET'])
def logout():
    del session[SESSION_KEY]
    del session[SESSION_KEY_UID]

    return redirect('%s?referer=/' % url_for('loginPage'))


@app.route('/view/<uid>', methods=['GET'])
def view(uid):
    data = col_concepts.find_one({'id': uid})
    user = _getUser(session[SESSION_KEY_UID])

    assert data['user_id'] == user['user_id']

    return render_template('views/view.html', data=data, 
                           original=base64.b64encode(
                                        json.dumps(data['original'])),
                           refined=base64.b64encode(
                                        json.dumps(data['refined'])))


@app.route('/view_list/<uid>', methods=['GET'])
def viewList(uid):
    data = col_concepts.find_one({'id': uid})
    user = _getUser(session[SESSION_KEY_UID])

    assert data['user_id'] == user['user_id']

    return render_template('views/view_list.html', data=data, 
                           original=base64.b64encode(
                                        json.dumps(data['original'])),
                           refined=base64.b64encode(
                                        json.dumps(data['refined'])))


@app.route('/all_concepts', methods=['GET'])
@login_required
def all_concepts():

    auth = _checkAuthenticated()
    if auth is not None:
        return auth

    user = _getUser(session[SESSION_KEY_UID])

    data = []
    for concept in col_concepts.find({'user_id': user['user_id']}):
        data.append(concept)

    return render_template('all_concepts.html', data=data)

# ---------------------------------------


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))

    app.secret_key = SECRET_KEY
    app.run(host='0.0.0.0', debug=True, port=port)



