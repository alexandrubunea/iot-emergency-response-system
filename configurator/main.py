import argparse, requests, time, hashlib, uuid

COMMUNICATION_NODE_ADDRESS = 'http://localhost:5000'
ESP32_DEVICE_ADDRESS = 'http://192.168.4.1:80'

def validate_employee_auth_token(employee_auth_token):
    try:
        res = requests.post(f'{COMMUNICATION_NODE_ADDRESS}/api/validate_employee_auth_token',
                            json={'employee_auth_token': employee_auth_token})
    except requests.exceptions.ConnectionError:
        print('Communication node is not available, please check your connection')
        exit(1)

    return res.status_code == 200

def check_if_business_exists(business_id):
    try:
        res = requests.get(f'{COMMUNICATION_NODE_ADDRESS}/api/business_exists/{business_id}')
    except requests.exceptions.ConnectionError:
        print('Communication node is not available, please check your connection')
        exit(1)

    return res.status_code == 200

def check_device_connection():
    try:
        res = requests.get(f'{ESP32_DEVICE_ADDRESS}/api/check_connection')
    except requests.exceptions.ConnectionError:
        return False

    return res.status_code == 200

def generate_secure_sha512_hash():
    random_uuid = str(uuid.uuid4())
    key = hashlib.sha512(random_uuid.encode()).hexdigest()
    return key

def upload_settings_to_communication_node(settings_dict):
    try:
        res = requests.post(f'{COMMUNICATION_NODE_ADDRESS}/api/register_device', json=settings_dict)
    except requests.exceptions.ConnectionError:
        print('Communication node is not available, please check your connection')
        exit(1)

    return res.status_code == 200

def embed_settings_to_device(settings_dict):
    try:
        res = requests.post(f'{ESP32_DEVICE_ADDRESS}/api/embed_settings', json=settings_dict)
    except requests.exceptions.ConnectionError:
        print('Device is not available, please check your connection')
        exit(1)

    return res.status_code == 200

if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        'This script registers a ESP32 device into the surveillance system\nAlso embeds the device with the required data'
        'to communicate with the communication node')
    parser.add_argument('employee_auth_token', type=str, help='The employee authentication token')

    args = parser.parse_args()

    if not validate_employee_auth_token(args.employee_auth_token):
        print('Invalid employee authentication token')
        exit(1)

    settings = dict.fromkeys(['business_id', 'device_location', 'motion_dection', 'gas_detection', 'sound_detection', 'fire_detection', 'hash_id'])

    settings['business_id'] = int(input('Please enter the business ID: '))
    if not check_if_business_exists(settings['business_id']):
        print('Business does not exist')
        exit(1)

    settings['device_location'] = input('Please enter the device location [Example: "Main Entrance", "Safe Room"]: ')
    settings['motion_detection'] = bool(input('Does the device have motion detection? [yes/no]: ').lower() == 'yes')
    settings['gas_detection'] = bool(input('Does the device have gas detection? [yes/no]: ').lower() == 'yes')
    settings['sound_detection'] = bool(input('Does the device have sound detection? [yes/no]: ').lower() == 'yes')
    settings['fire_detection'] = bool(input('Does the device have fire detection? [yes/no]: ').lower() == 'yes')
    settings['hash_id'] = generate_secure_sha512_hash()

    if not upload_settings_to_communication_node(settings):
        print('Failed to upload settings to the communication node')
        exit(1)
    print('Settings uploaded to the communication node')

    print('Please connect to the ESP32 device\nThe default SSID is "ESP32" and the password is "admin1234"')
    print('After connecting to the device, an unique device ID will be created and stored in the device and the communication node database')
    print('Please, after connecting to the device, DO NOT QUIT THIS SCRIPT and FOLLOW THE INSTRUCTIONS')
    
    while not check_device_connection():
        time.sleep(3)
        
    print('Device connected')

    print('Embedding settings to the device...')
    if not embed_settings_to_device(settings):
        print('Failed to embed settings to the device')
        exit(1)
    
    print('Settings embedded to the device')
    print('Device registration completed successfully')
