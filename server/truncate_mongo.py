from pymongo import MongoClient

lines = []

with open('server/auth.data', 'r') as f:
    for l in f:
        lines.append(l[:-1])

assert len(lines) == 2

username = lines[0]
password = lines[1]

# MongoLab
connection = MongoClient("ds019628.mlab.com", 19628)
db = connection["bgraph"]
db.authenticate(username, password)

col_concepts = db.concepts
col_concepts.remove()