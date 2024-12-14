from flask import Flask

app = Flask(__name__)

@app.route('/api/register-esp32', methods=['POST'])
def register_esp32():
    # Logic to register ESP32 device will be implemented here
    return 'WIP'

if __name__ == '__main__':
    app.run()
