"""
GUI application alternative to the command line interface for emulating API calls made by a security device.
"""

import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext
import requests
import json
import uuid

class ApiEmulatorApp(tk.Tk):
    """
    GUI application for emulating security device API calls.
    """
    def __init__(self):
        super().__init__()
        self.title("API Call Emulator")

        self.base_url = tk.StringVar(value="http://localhost:5000")
        self.configurator_api_key = tk.StringVar()
        self.device_api_key = tk.StringVar()

        self.dynamic_widgets = {}

        settings_frame = ttk.LabelFrame(self, text="Settings", padding="10")
        settings_frame.grid(row=0, column=0, columnspan=2, padx=10, pady=5, sticky="ew")

        configurator_frame = ttk.LabelFrame(self, text="Configurator Calls (Level 1 Key)", padding="10")
        configurator_frame.grid(row=1, column=0, padx=10, pady=5, sticky="nsew")

        device_frame = ttk.LabelFrame(self, text="Device Calls (Level 2 Key)", padding="10")
        device_frame.grid(row=1, column=1, padx=10, pady=5, sticky="nsew")

        self.dynamic_input_frame = ttk.LabelFrame(self, text="Call Specific Inputs", padding="10")

        output_frame = ttk.LabelFrame(self, text="Request & Response Log", padding="10")
        output_frame.grid(row=3, column=0, columnspan=2, padx=10, pady=10, sticky="nsew")

        self.columnconfigure(0, weight=1)
        self.columnconfigure(1, weight=1)
        self.rowconfigure(1, weight=0)
        self.rowconfigure(2, weight=0)
        self.rowconfigure(3, weight=1)

        self._create_settings_widgets(settings_frame)
        self._create_configurator_widgets(configurator_frame)
        self._create_device_widgets(device_frame)
        self._create_output_widgets(output_frame)

    def _create_settings_widgets(self, parent):
        ttk.Label(parent, text="Base URL:").grid(row=0, column=0, padx=5, pady=2, sticky="w")
        ttk.Entry(parent, textvariable=self.base_url, width=50).grid(row=0, column=1, padx=5, pady=2, sticky="ew")

        ttk.Label(parent, text="Configurator Key (L1):").grid(row=1, column=0, padx=5, pady=2, sticky="w")
        ttk.Entry(parent, textvariable=self.configurator_api_key, width=50, show="*").grid(row=1, column=1, padx=5, pady=2, sticky="ew")

        ttk.Label(parent, text="Device Key (L2):").grid(row=2, column=0, padx=5, pady=2, sticky="w")
        ttk.Entry(parent, textvariable=self.device_api_key, width=50, show="*").grid(row=2, column=1, padx=5, pady=2, sticky="ew")

        parent.columnconfigure(1, weight=1)

    def _create_configurator_widgets(self, parent):
        ttk.Button(parent, text="Register Device", command=self._setup_register_device_ui).pack(fill='x', pady=3)
        ttk.Button(parent, text="Check Business Exists", command=self._setup_business_exists_ui).pack(fill='x', pady=3)
        ttk.Button(parent, text="Validate Employee Token", command=self._execute_validate_token).pack(fill='x', pady=3)

        ttk.Label(parent, text="").pack()

    def _create_device_widgets(self, parent):
        ttk.Button(parent, text="Send Alert", command=self._setup_send_alert_ui).pack(fill='x', pady=3)
        ttk.Button(parent, text="Send Malfunction", command=self._setup_send_malfunction_ui).pack(fill='x', pady=3)
        ttk.Button(parent, text="Send Log", command=self._setup_send_log_ui).pack(fill='x', pady=3)

        ttk.Label(parent, text="").pack()


    def _create_output_widgets(self, parent):
        self.output_text = scrolledtext.ScrolledText(parent, wrap=tk.WORD, height=15, width=80)
        self.output_text.pack(expand=True, fill="both")
        self.output_text.configure(state='disabled')

        clear_button = ttk.Button(parent, text="Clear Log", command=self._clear_log)
        clear_button.pack(pady=5, side=tk.RIGHT)

    def _clear_log(self):
        self.output_text.configure(state='normal')
        self.output_text.delete('1.0', tk.END)
        self.output_text.configure(state='disabled')

    def _clear_dynamic_inputs(self):
        for widget in self.dynamic_input_frame.winfo_children():
            widget.destroy()
        self.dynamic_widgets.clear()
        self.dynamic_input_frame.grid_remove()

    def _show_dynamic_frame(self):
        self.dynamic_input_frame.grid(row=2, column=0, columnspan=2, padx=10, pady=5, sticky="ew")

    def _add_execute_button(self, command_func, text="Execute Request"):
         ttk.Button(self.dynamic_input_frame, text=text, command=command_func).grid(row=100, column=0, columnspan=2, pady=10)


    def _setup_register_device_ui(self):
        self._clear_dynamic_inputs()
        self._show_dynamic_frame()
        frame = self.dynamic_input_frame

        ttk.Label(frame, text="New Device API Key:").grid(row=0, column=0, padx=5, pady=2, sticky="w")
        suggested_key = str(uuid.uuid4())[:64]
        self.dynamic_widgets['api_key'] = tk.StringVar(value=suggested_key)
        ttk.Entry(frame, textvariable=self.dynamic_widgets['api_key'], width=50).grid(row=0, column=1, padx=5, pady=2, sticky="ew")

        ttk.Label(frame, text="Device Location:").grid(row=1, column=0, padx=5, pady=2, sticky="w")
        self.dynamic_widgets['location'] = tk.StringVar(value="Living Room Sensor")
        ttk.Entry(frame, textvariable=self.dynamic_widgets['location'], width=40).grid(row=1, column=1, padx=5, pady=2, sticky="ew")

        ttk.Label(frame, text="Business ID:").grid(row=2, column=0, padx=5, pady=2, sticky="w")
        self.dynamic_widgets['business_id'] = tk.StringVar(value="1")
        ttk.Entry(frame, textvariable=self.dynamic_widgets['business_id'], width=10).grid(row=2, column=1, padx=5, pady=2, sticky="w")

        self.dynamic_widgets['motion'] = tk.BooleanVar(value=True)
        ttk.Checkbutton(frame, text="Motion Sensor", variable=self.dynamic_widgets['motion']).grid(row=3, column=0, padx=5, pady=2, sticky="w")
        self.dynamic_widgets['sound'] = tk.BooleanVar(value=True)
        ttk.Checkbutton(frame, text="Sound Sensor", variable=self.dynamic_widgets['sound']).grid(row=3, column=1, padx=5, pady=2, sticky="w")
        self.dynamic_widgets['fire'] = tk.BooleanVar(value=True)
        ttk.Checkbutton(frame, text="Fire Sensor", variable=self.dynamic_widgets['fire']).grid(row=4, column=0, padx=5, pady=2, sticky="w")
        self.dynamic_widgets['gas'] = tk.BooleanVar(value=True)
        ttk.Checkbutton(frame, text="Gas Sensor", variable=self.dynamic_widgets['gas']).grid(row=4, column=1, padx=5, pady=2, sticky="w")

        frame.columnconfigure(1, weight=1)
        self._add_execute_button(self._execute_register_device)


    def _setup_business_exists_ui(self):
        self._clear_dynamic_inputs()
        self._show_dynamic_frame()
        frame = self.dynamic_input_frame

        ttk.Label(frame, text="Business ID to Check:").grid(row=0, column=0, padx=5, pady=2, sticky="w")
        self.dynamic_widgets['business_id'] = tk.StringVar(value="1")
        ttk.Entry(frame, textvariable=self.dynamic_widgets['business_id'], width=10).grid(row=0, column=1, padx=5, pady=2, sticky="w")

        self._add_execute_button(self._execute_business_exists)

    def _setup_send_alert_ui(self):
        self._clear_dynamic_inputs()
        self._show_dynamic_frame()
        frame = self.dynamic_input_frame

        ttk.Label(frame, text="Alert Type:").grid(row=0, column=0, padx=5, pady=2, sticky="w")
        alert_types = ['fire_alert', 'gas_alert', 'motion_alert', 'sound_alert']
        self.dynamic_widgets['alert_type'] = tk.StringVar(value=alert_types[0])
        combo = ttk.Combobox(frame, textvariable=self.dynamic_widgets['alert_type'], values=alert_types, state='readonly', width=30)
        combo.grid(row=0, column=1, padx=5, pady=2, sticky="ew")

        ttk.Label(frame, text="Message (Optional):").grid(row=1, column=0, padx=5, pady=2, sticky="w")
        self.dynamic_widgets['message'] = tk.StringVar()
        ttk.Entry(frame, textvariable=self.dynamic_widgets['message'], width=40).grid(row=1, column=1, padx=5, pady=2, sticky="ew")

        frame.columnconfigure(1, weight=1)
        self._add_execute_button(self._execute_send_alert)

    def _setup_send_malfunction_ui(self):
        self._clear_dynamic_inputs()
        self._show_dynamic_frame()
        frame = self.dynamic_input_frame

        ttk.Label(frame, text="Malfunction Type:").grid(row=0, column=0, padx=5, pady=2, sticky="w")
        malfunction_types = ['fire_sensor', 'gas_sensor', 'sound_sensor', 'motion_sensor', 'general_malfunction']
        self.dynamic_widgets['malfunction_type'] = tk.StringVar(value=malfunction_types[0])
        combo = ttk.Combobox(frame, textvariable=self.dynamic_widgets['malfunction_type'], values=malfunction_types, state='readonly', width=30)
        combo.grid(row=0, column=1, padx=5, pady=2, sticky="ew")

        ttk.Label(frame, text="Message (Optional):").grid(row=1, column=0, padx=5, pady=2, sticky="w")
        self.dynamic_widgets['message'] = tk.StringVar()
        ttk.Entry(frame, textvariable=self.dynamic_widgets['message'], width=40).grid(row=1, column=1, padx=5, pady=2, sticky="ew")

        frame.columnconfigure(1, weight=1)
        self._add_execute_button(self._execute_send_malfunction)

    def _setup_send_log_ui(self):
        self._clear_dynamic_inputs()
        self._show_dynamic_frame()
        frame = self.dynamic_input_frame

        ttk.Label(frame, text="Log Type:").grid(row=0, column=0, padx=5, pady=2, sticky="w")
        log_types = ['esp32_boot', 'gas_sensor_warmup']
        self.dynamic_widgets['log_type'] = tk.StringVar(value=log_types[0])
        combo = ttk.Combobox(frame, textvariable=self.dynamic_widgets['log_type'], values=log_types, state='readonly', width=30)
        combo.grid(row=0, column=1, padx=5, pady=2, sticky="ew")

        ttk.Label(frame, text="Message (Optional):").grid(row=1, column=0, padx=5, pady=2, sticky="w")
        self.dynamic_widgets['message'] = tk.StringVar()
        ttk.Entry(frame, textvariable=self.dynamic_widgets['message'], width=40).grid(row=1, column=1, padx=5, pady=2, sticky="ew")

        frame.columnconfigure(1, weight=1)
        self._add_execute_button(self._execute_send_log)

    def _log_output(self, message):
        self.output_text.configure(state='normal')
        self.output_text.insert(tk.END, message + "\n")
        self.output_text.see(tk.END) # Scroll to the end
        self.output_text.configure(state='disabled')

    def _display_response_gui(self, response):
        self._log_output("\n--- Response ---")
        self._log_output(f"Status Code: {response.status_code}")
        self._log_output("Headers:")
        for key, value in response.headers.items():
            log_value = "***REDACTED***" if key.lower() in ['set-cookie', 'authorization'] else value
            self._log_output(f"  {key}: {log_value}")
        try:
            body = json.dumps(response.json(), indent=2)
            self._log_output("Body (JSON):")
            self._log_output(body)
        except json.JSONDecodeError:
            self._log_output("Body (Text):")
            self._log_output(response.text if response.text else "[No Body]")
        except Exception as e:
            self._log_output(f"Could not parse response body: {e}")
            self._log_output("Raw Body:")
            self._log_output(response.text if response.text else "[No Body]")
        self._log_output("---------------")

    def _make_request_gui(self, method, endpoint, headers=None, json_payload=None, required_key_level=0):
        base = self.base_url.get()
        if not base:
            messagebox.showerror("Error", "API Base URL not set in Settings.")
            return None

        auth_header = None
        config_key = self.configurator_api_key.get()
        dev_key = self.device_api_key.get()

        if required_key_level == 1:
            if not config_key:
                messagebox.showerror("Error", "Configurator API Key (Level 1) not set in Settings.")
                return None
            auth_header = {"Authorization": f"Bearer {config_key}"}
        elif required_key_level == 2:
            if not dev_key:
                messagebox.showerror("Error", "Device API Key (Level 2) not set in Settings.")
                return None
            auth_header = {"Authorization": f"Bearer {dev_key}"}

        full_headers = auth_header.copy() if auth_header else {}
        if headers:
            full_headers.update(headers)
        if json_payload and "Content-Type" not in full_headers:
             full_headers["Content-Type"] = "application/json"


        if not endpoint.startswith('/'):
            endpoint = '/' + endpoint
        if base.endswith('/'):
            base = base[:-1]

        url = f"{base}{endpoint}"

        self._log_output(f"\n>>> Making {method.upper()} request to: {url}")
        if full_headers:
            printable_headers = full_headers.copy()
            if 'Authorization' in printable_headers:
                printable_headers['Authorization'] = 'Bearer ***REDACTED***'
            self._log_output(f"Headers: {printable_headers}")
        if json_payload:
            self._log_output(f"JSON Payload: {json.dumps(json_payload, indent=2)}")
        self._log_output("----------------")

        response = None
        try:
            response = requests.request(method, url, headers=full_headers, json=json_payload, timeout=30)
            self._display_response_gui(response)

        except requests.exceptions.ConnectionError as e:
            error_msg = f"\nError: Could not connect to the server at {base}.\nPlease ensure the server is running and the Base URL is correct.\nDetails: {e}"
            self._log_output(error_msg)
            messagebox.showerror("Connection Error", error_msg)
        except requests.exceptions.Timeout:
            error_msg = "\nError: Request timed out after 30 seconds."
            self._log_output(error_msg)
            messagebox.showerror("Timeout Error", error_msg)
        except requests.exceptions.RequestException as e:
            error_msg = f"\nAn unexpected error occurred during the request: {e}"
            self._log_output(error_msg)
            messagebox.showerror("Request Error", error_msg)
        except Exception as e: # Catch other potential errors
            error_msg = f"\nAn unexpected error occurred: {e}"
            self._log_output(error_msg)
            messagebox.showerror("Error", error_msg)

        return response

    def _execute_register_device(self):
        try:
            api_key = self.dynamic_widgets['api_key'].get()
            location = self.dynamic_widgets['location'].get()
            business_id_str = self.dynamic_widgets['business_id'].get()
            motion = self.dynamic_widgets['motion'].get()
            sound = self.dynamic_widgets['sound'].get()
            fire = self.dynamic_widgets['fire'].get()
            gas = self.dynamic_widgets['gas'].get()

            if not api_key:
                 messagebox.showerror("Input Error", "New Device API Key cannot be empty.")
                 return
            if not location:
                 messagebox.showerror("Input Error", "Device Location cannot be empty.")
                 return
            try:
                business_id = int(business_id_str)
            except ValueError:
                messagebox.showerror("Input Error", "Business ID must be an integer.")
                return

            payload = {
                "api_key": api_key,
                "device_location": location,
                "motion": motion,
                "sound": sound,
                "fire": fire,
                "gas": gas,
                "business_id": business_id
            }

            response = self._make_request_gui("POST", "/api/register_device", json_payload=payload, required_key_level=1)
            if response and response.status_code == 200:
                self._log_output("\nSuggestion: If registration was successful, you might want to copy")
                self._log_output(f"the key '{api_key}' to the 'Device Key (L2)' setting above.")

        except KeyError as e:
             messagebox.showerror("Error", f"Missing input field: {e}. Please re-select 'Register Device'.")
        except Exception as e:
            messagebox.showerror("Error", f"An error occurred: {e}")


    def _execute_business_exists(self):
        try:
            business_id = self.dynamic_widgets['business_id'].get()
            if not business_id.isdigit():
                messagebox.showerror("Input Error", "Business ID must be an integer.")
                return

            endpoint = f"/api/business_exists/{business_id}"
            self._make_request_gui("GET", endpoint, required_key_level=1)

        except KeyError as e:
             messagebox.showerror("Error", f"Missing input field: {e}. Please re-select 'Check Business Exists'.")
        except Exception as e:
            messagebox.showerror("Error", f"An error occurred: {e}")

    def _execute_validate_token(self):
        self._clear_dynamic_inputs()
        self._make_request_gui("GET", "/api/validate_employee_auth_token", required_key_level=1)


    def _execute_send_alert(self):
        try:
            alert_type = self.dynamic_widgets['alert_type'].get()
            message = self.dynamic_widgets['message'].get()

            payload = {"alert_type": alert_type}
            if message:
                payload["message"] = message

            self._make_request_gui("POST", "/api/send_alert", json_payload=payload, required_key_level=2)

        except KeyError as e:
             messagebox.showerror("Error", f"Missing input field: {e}. Please re-select 'Send Alert'.")
        except Exception as e:
            messagebox.showerror("Error", f"An error occurred: {e}")

    def _execute_send_malfunction(self):
        try:
            malfunction_type = self.dynamic_widgets['malfunction_type'].get()
            message = self.dynamic_widgets['message'].get()

            payload = {"malfunction_type": malfunction_type}
            if message:
                payload["message"] = message

            self._make_request_gui("POST", "/api/send_malfunction", json_payload=payload, required_key_level=2)

        except KeyError as e:
             messagebox.showerror("Error", f"Missing input field: {e}. Please re-select 'Send Malfunction'.")
        except Exception as e:
            messagebox.showerror("Error", f"An error occurred: {e}")


    def _execute_send_log(self):
        try:
            log_type = self.dynamic_widgets['log_type'].get()
            message = self.dynamic_widgets['message'].get()

            payload = {"log_type": log_type}
            if message:
                payload["message"] = message

            self._make_request_gui("POST", "/api/send_log", json_payload=payload, required_key_level=2)

        except KeyError as e:
             messagebox.showerror("Error", f"Missing input field: {e}. Please re-select 'Send Log'.")
        except Exception as e:
            messagebox.showerror("Error", f"An error occurred: {e}")


if __name__ == "__main__":
    app = ApiEmulatorApp()
    app.mainloop()
