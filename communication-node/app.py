from flask import Flask, Response

app = Flask(__name__)

@app.route('/api/register_device', methods=['POST'])
def register_device():
    return Response('{"status":"success"}', status=200, mimetype='application/json')

@app.route('/api/validate_employee_auth_token', methods=['POST'])
def validate_employee_auth_token():
    return Response('{"status":"success"}', status=200, mimetype='application/json')

@app.route('/api/business_exists/<business_id>', methods=['GET'])
def business_exists(business_id):
    return Response('{"status":"success"}', status=200, mimetype='application/json')

if __name__ == '__main__':
    app.run()
