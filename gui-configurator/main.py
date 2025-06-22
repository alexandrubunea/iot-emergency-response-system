"""
GUI alternative for command line interface to configure ESP32 security device.
"""
import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext, filedialog
import requests
import json
import hashlib
import uuid
import time
import re

DEFAULT_COMM_NODE = "http://localhost:5000"
DEFAULT_ESP32_ADDR = "http://192.168.4.1:80"
ESP32_DEFAULT_SSID = "ESP32"
ESP32_DEFAULT_PASSWORD = "admin1234"
REQUEST_TIMEOUT = 10
ESP32_CONNECT_ATTEMPTS = 20
ESP32_CONNECT_WAIT_TIME_MS = 3000

class EspConfiguratorApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("ESP32 Security Device Configurator")

        self.auth_token = tk.StringVar()
        self.comm_node_addr = tk.StringVar(value=DEFAULT_COMM_NODE)
        self.esp32_addr = tk.StringVar(value=DEFAULT_ESP32_ADDR)
        self.business_id = tk.StringVar()
        self.device_location = tk.StringVar()
        self.wifi_ssid = tk.StringVar()
        self.wifi_password = tk.StringVar()
        self.api_key = tk.StringVar()

        self.sensor_motion = tk.BooleanVar(value=False)
        self.sensor_gas = tk.BooleanVar(value=False)
        self.sensor_sound = tk.BooleanVar(value=False)
        self.sensor_fire = tk.BooleanVar(value=False)
        self.save_backup = tk.BooleanVar(value=True)

        self.settings_dict = {}
        self.token_validated = False
        self.config_generated = False
        self.esp32_connect_attempt_count = 0
        self.after_id = None

        top_frame = ttk.Frame(self, padding="10")
        top_frame.grid(row=0, column=0, sticky="ew")
        self._create_top_widgets(top_frame)

        self.config_frame = ttk.LabelFrame(self, text="Configuration Details", padding="10")
        self.config_frame.grid(row=1, column=0, padx=10, pady=5, sticky="nsew")
        self._create_config_widgets(self.config_frame)

        action_frame = ttk.Frame(self, padding="10")
        action_frame.grid(row=2, column=0, pady=5, sticky="ew")
        self._create_action_widgets(action_frame)

        log_frame = ttk.LabelFrame(self, text="Status Log", padding="10")
        log_frame.grid(row=3, column=0, padx=10, pady=10, sticky="nsew")
        self._create_log_widgets(log_frame)

        self.rowconfigure(3, weight=1)
        self.columnconfigure(0, weight=1)

        self._set_widget_state(self.config_frame, tk.DISABLED)
        self._set_widget_state(action_frame, tk.DISABLED)
        self.validate_token_btn.config(state=tk.NORMAL)

        self._log("Welcome! Please enter addresses and your Employee Token, then click 'Validate Token & Start'.")


    def _create_top_widgets(self, parent):
        ttk.Label(parent, text="Comm Node Addr:").grid(row=0, column=0, padx=5, pady=2, sticky="w")
        ttk.Entry(parent, textvariable=self.comm_node_addr, width=40).grid(row=0, column=1, padx=5, pady=2, sticky="ew")

        ttk.Label(parent, text="ESP32 Addr:").grid(row=0, column=2, padx=(15,5), pady=2, sticky="w")
        ttk.Entry(parent, textvariable=self.esp32_addr, width=30).grid(row=0, column=3, padx=5, pady=2, sticky="ew")

        ttk.Label(parent, text="Employee Token:").grid(row=1, column=0, padx=5, pady=5, sticky="w")
        ttk.Entry(parent, textvariable=self.auth_token, width=40, show="*").grid(row=1, column=1, padx=5, pady=5, sticky="ew")

        self.validate_token_btn = ttk.Button(parent, text="Validate Token & Start", command=self._validate_token_and_start)
        self.validate_token_btn.grid(row=1, column=2, columnspan=2, padx=10, pady=5, sticky="ew")

        parent.columnconfigure(1, weight=1)
        parent.columnconfigure(3, weight=1)

    def _create_config_widgets(self, parent):
        biz_loc_frame = ttk.LabelFrame(parent, text="Business & Location", padding="5")
        biz_loc_frame.grid(row=0, column=0, padx=5, pady=5, sticky="ew")

        ttk.Label(biz_loc_frame, text="Business ID:").grid(row=0, column=0, padx=5, pady=2, sticky="w")
        ttk.Entry(biz_loc_frame, textvariable=self.business_id, width=15).grid(row=0, column=1, padx=5, pady=2, sticky="w")

        ttk.Label(biz_loc_frame, text="Device Location:").grid(row=1, column=0, padx=5, pady=2, sticky="w")
        ttk.Entry(biz_loc_frame, textvariable=self.device_location, width=30).grid(row=1, column=1, padx=5, pady=2, sticky="ew")
        biz_loc_frame.columnconfigure(1, weight=1)

        sensor_frame = ttk.LabelFrame(parent, text="Sensor Capabilities", padding="5")
        sensor_frame.grid(row=0, column=1, padx=5, pady=5, sticky="nsew", rowspan=2)

        ttk.Checkbutton(sensor_frame, text="Motion", variable=self.sensor_motion).grid(row=0, column=0, sticky="w", padx=5, pady=1)
        ttk.Checkbutton(sensor_frame, text="Gas", variable=self.sensor_gas).grid(row=1, column=0, sticky="w", padx=5, pady=1)
        ttk.Checkbutton(sensor_frame, text="Sound", variable=self.sensor_sound).grid(row=2, column=0, sticky="w", padx=5, pady=1)
        ttk.Checkbutton(sensor_frame, text="Fire", variable=self.sensor_fire).grid(row=3, column=0, sticky="w", padx=5, pady=1)

        wifi_frame = ttk.LabelFrame(parent, text="WiFi Credentials (for Device)", padding="5")
        wifi_frame.grid(row=1, column=0, padx=5, pady=5, sticky="ew")

        ttk.Label(wifi_frame, text="SSID:").grid(row=0, column=0, padx=5, pady=2, sticky="w")
        ttk.Entry(wifi_frame, textvariable=self.wifi_ssid, width=30).grid(row=0, column=1, padx=5, pady=2, sticky="ew")

        ttk.Label(wifi_frame, text="Password:").grid(row=1, column=0, padx=5, pady=2, sticky="w")
        ttk.Entry(wifi_frame, textvariable=self.wifi_password, width=30, show="*").grid(row=1, column=1, padx=5, pady=2, sticky="ew")
        wifi_frame.columnconfigure(1, weight=1)

        parent.columnconfigure(0, weight=1)
        parent.columnconfigure(1, weight=0)

    def _create_action_widgets(self, parent):
        self.generate_summary_btn = ttk.Button(parent, text="Validate Inputs & Show Summary", command=self._generate_summary)
        self.generate_summary_btn.grid(row=0, column=0, padx=(0,5), pady=5, sticky="ew")

        self.proceed_btn = ttk.Button(parent, text="Confirm & Proceed with Configuration", command=self._confirm_and_proceed, state=tk.DISABLED)
        self.proceed_btn.grid(row=0, column=1, padx=(5,0), pady=5, sticky="ew")

        parent.columnconfigure(0, weight=1)
        parent.columnconfigure(1, weight=1)


    def _create_log_widgets(self, parent):
        self.log_text = scrolledtext.ScrolledText(parent, wrap=tk.WORD, height=15, width=80)
        self.log_text.grid(row=0, column=0, sticky="nsew")
        self.log_text.configure(state='disabled')

        progress_frame = ttk.Frame(parent)
        progress_frame.grid(row=1, column=0, sticky="ew", pady=(5,0))

        self.progress_label = ttk.Label(progress_frame, text="Progress:")
        self.progress_label.pack(side=tk.LEFT, padx=(0, 5))
        self.progress_bar = ttk.Progressbar(progress_frame, orient='horizontal', mode='determinate', maximum=ESP32_CONNECT_ATTEMPTS)
        self.progress_bar.pack(side=tk.LEFT, expand=True, fill='x')

        parent.rowconfigure(0, weight=1)
        parent.columnconfigure(0, weight=1)

    def _set_widget_state(self, master, state):
        for widget in master.winfo_children():
            if isinstance(widget, (ttk.Button, ttk.Entry, ttk.Checkbutton, ttk.Combobox, ttk.Radiobutton, scrolledtext.ScrolledText)):
                 try:
                    widget.configure(state=state)
                 except tk.TclError:
                    pass
            if isinstance(widget, (ttk.Frame, ttk.LabelFrame, tk.Frame)):
                self._set_widget_state(widget, state)

    def _log(self, message):
        self.log_text.configure(state='normal')
        self.log_text.insert(tk.END, f"{time.strftime('%H:%M:%S')} - {message}\n")
        self.log_text.see(tk.END)
        self.log_text.configure(state='disabled')
        self.update_idletasks()

    def _make_request(self, url, method="GET", headers=None, json_payload=None, timeout=REQUEST_TIMEOUT):
        self._log(f"Sending {method} request to {url}...")
        try:
            response = requests.request(method, url, headers=headers, json=json_payload, timeout=timeout)
            self._log(f"Response status: {response.status_code}")
            if response.status_code < 200 or response.status_code >= 300:
                 try:
                    self._log(f"Response body: {response.json()}")
                 except json.JSONDecodeError:
                    self._log(f"Response text: {response.text[:200]}...")
            return response
        except requests.exceptions.Timeout:
            self._log(f"[Error] Request timed out after {timeout} seconds.")
            messagebox.showerror("Timeout", f"Request to {url} timed out.")
            return None
        except requests.exceptions.ConnectionError as e:
            self._log(f"[Error] Connection error: {e}")
            messagebox.showerror("Connection Error", f"Could not connect to {url}.\nCheck address and network.\nError: {e}")
            return None
        except requests.exceptions.RequestException as e:
            self._log(f"[Error] Request exception: {e}")
            messagebox.showerror("Request Error", f"An error occurred during the request to {url}.\nError: {e}")
            return None

    def _validate_location(self, location):
        if not location or len(location) < 3 or not re.match(r"^[a-zA-Z0-9\s\-_]+$", location):
            return False
        return True

    def _validate_ssid(self, ssid):
        return 1 <= len(ssid) <= 32

    def _validate_password(self, password):
        return len(password) >= 8

    def _validate_token_and_start(self):
        token = self.auth_token.get()
        comm_node = self.comm_node_addr.get()
        if not token:
            messagebox.showerror("Input Error", "Please enter the Employee Authentication Token.")
            return
        if not comm_node:
            messagebox.showerror("Input Error", "Please enter the Communication Node Address.")
            return

        url = f"{comm_node.rstrip('/')}/api/validate_employee_auth_token"
        headers = {"Authorization": f"Bearer {token}"}

        self._log("Validating employee authentication token...")
        response = self._make_request(url, headers=headers)

        if response and response.status_code == 200:
            self._log("[Success] Employee authentication successful!")
            self.token_validated = True
            self._set_widget_state(self.config_frame, tk.NORMAL)
            self.generate_summary_btn.config(state=tk.NORMAL)
            self.proceed_btn.config(state=tk.DISABLED)
            self.validate_token_btn.config(state=tk.DISABLED)
            self._log("Please fill in the configuration details below.")
        else:
            self._log("[Error] Invalid employee authentication token or communication node error.")
            messagebox.showerror("Authentication Failed", "Invalid Employee Token or failed to reach Communication Node. Check token and address.")
            self.token_validated = False

    def _generate_summary(self):
        bid_str = self.business_id.get()
        location = self.device_location.get()
        ssid = self.wifi_ssid.get()
        password = self.wifi_password.get()
        comm_node = self.comm_node_addr.get()
        token = self.auth_token.get()

        self.settings_dict = {}
        self.config_generated = False
        self.proceed_btn.config(state=tk.DISABLED)

        try:
            bid = int(bid_str)
            self._log(f"Checking existence of Business ID: {bid}...")
            url = f"{comm_node.rstrip('/')}/api/business_exists/{bid}"
            headers = {"Authorization": f"Bearer {token}"}
            response = self._make_request(url, headers=headers)
            if not response or response.status_code != 200:
                self._log(f"[Error] Business ID {bid} does not exist or communication node error.")
                messagebox.showerror("Validation Error", f"Business ID '{bid}' not found or communication error.")
                return
            self.settings_dict["business_id"] = bid
            self._log(f"Business ID {bid} validated.")
        except ValueError:
            messagebox.showerror("Validation Error", "Business ID must be a valid integer.")
            return
        except Exception as e:
             messagebox.showerror("Validation Error", f"Error validating Business ID: {e}")
             return

        if not self._validate_location(location):
            messagebox.showerror("Validation Error", "Invalid Device Location format (min 3 chars, alphanumeric/space/hyphen).")
            return
        self.settings_dict["device_location"] = location.lower()

        if not self._validate_ssid(ssid):
            messagebox.showerror("Validation Error", "Invalid WiFi SSID format (1-32 characters).")
            return
        self.settings_dict["ssid"] = ssid

        if not self._validate_password(password):
             messagebox.showerror("Validation Error", "Invalid WiFi Password format (min 8 characters).")
             return
        self.settings_dict["password"] = password

        self.settings_dict["motion"] = self.sensor_motion.get()
        self.settings_dict["gas"] = self.sensor_gas.get()
        self.settings_dict["sound"] = self.sensor_sound.get()
        self.settings_dict["fire"] = self.sensor_fire.get()

        random_uuid = str(uuid.uuid4())
        generated_key = hashlib.sha256(random_uuid.encode()).hexdigest()[:64]
        self.settings_dict["api_key"] = generated_key
        self.api_key.set(f"{generated_key[:8]}...{generated_key[-8:]}")
        self._log("Generated new API Key.")

        self._log("\n--- Configuration Summary ---")
        self._log(f"Business ID: {self.settings_dict['business_id']}")
        self._log(f"Device Location: {self.settings_dict['device_location']}")
        self._log(f"Motion Detection: {'Enabled' if self.settings_dict['motion'] else 'Disabled'}")
        self._log(f"Gas Detection: {'Enabled' if self.settings_dict['gas'] else 'Disabled'}")
        self._log(f"Sound Detection: {'Enabled' if self.settings_dict['sound'] else 'Disabled'}")
        self._log(f"Fire Detection: {'Enabled' if self.settings_dict['fire'] else 'Disabled'}")
        self._log(f"WiFi SSID: {self.settings_dict['ssid']}")
        self._log(f"API Key: {self.api_key.get()}")
        self._log("--------------------------")
        self._log("Configuration summary generated. Review and click 'Confirm & Proceed'.")

        self.config_generated = True
        self.proceed_btn.config(state=tk.NORMAL)

    def _confirm_and_proceed(self):
        if not self.token_validated or not self.config_generated:
            messagebox.showwarning("Warning", "Cannot proceed. Validate token and generate summary first.")
            return

        if not messagebox.askyesno("Confirm Configuration", "Are you sure you want to proceed with this configuration?\nThis will register the device on the server and attempt to configure the ESP32."):
            self._log("Configuration cancelled by user.")
            return

        self._set_widget_state(self.config_frame, tk.DISABLED)
        self.generate_summary_btn.config(state=tk.DISABLED)
        self.proceed_btn.config(state=tk.DISABLED)

        self._start_configuration_steps()

    def _start_configuration_steps(self):
        if not self._upload_to_comm_node():
             self._re_enable_config_on_failure()
             return

        if self.save_backup.get():
             self._save_backup_file()

        self._log("\n--- ESP32 Configuration ---")
        self._log(f"Please connect your computer to the ESP32's WiFi network.")
        self._log(f"Default SSID: '{ESP32_DEFAULT_SSID}', Default Password: '{ESP32_DEFAULT_PASSWORD}'")
        self._log(f"Waiting for connection to ESP32 at {self.esp32_addr.get()}...")
        self.esp32_connect_attempt_count = 0
        self.progress_bar['value'] = 0
        self.progress_bar.config(maximum=ESP32_CONNECT_ATTEMPTS)
        if self.after_id:
            self.after_cancel(self.after_id)
        self._check_esp32_connection_loop()


    def _upload_to_comm_node(self, retry=False):
        comm_node = self.comm_node_addr.get()
        token = self.auth_token.get()
        url = f"{comm_node.rstrip('/')}/api/register_device"
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

        upload_payload = self.settings_dict.copy()
        if "password" in upload_payload:
            del upload_payload["password"]
        if "ssid" in upload_payload:
             del upload_payload["ssid"]

        self._log("Uploading configuration to communication node...")
        response = self._make_request(url, method="POST", headers=headers, json_payload=upload_payload)

        if response and response.status_code == 200:
            self._log("[Success] Configuration uploaded to communication node.")
            return True
        else:
            err_msg = "Failed to upload configuration to communication node."
            try:
                 err_details = response.json().get("message", "Unknown server error") if response else "No response"
                 err_msg += f"\nServer Response: {err_details}"
            except:
                 err_msg += f"\nStatus Code: {response.status_code if response else 'N/A'}"
            self._log(f"[Error] {err_msg}")

            if not retry:
                 if messagebox.askyesno("Upload Failed", f"{err_msg}\n\nDo you want to retry?"):
                     return self._upload_to_comm_node(retry=True)
                 else:
                     return False
            else:
                messagebox.showerror("Upload Failed", f"{err_msg}\nUpload failed after retry.")
                return False

    def _save_backup_file(self):
        self._log("Saving configuration backup...")
        backup_settings = self.settings_dict.copy()
        if "password" in backup_settings:
            backup_settings["password"] = "********"

        timestamp = time.strftime("%Y%m%d-%H%M%S")
        default_filename = f"device_config_business{backup_settings['business_id']}_{timestamp}.json"

        try:
            filepath = filedialog.asksaveasfilename(
                defaultextension=".json",
                initialfile=default_filename,
                filetypes=[("JSON files", "*.json"), ("All files", "*.*")],
                title="Save Configuration Backup"
            )
            if filepath:
                with open(filepath, "w", encoding="utf-8") as f:
                    json.dump(backup_settings, f, indent=2)
                self._log(f"[Success] Configuration backup saved to {filepath}")
            else:
                 self._log("Backup save cancelled by user.")
        except Exception as e:
             self._log(f"[Error] Could not save configuration backup: {e}")
             messagebox.showwarning("Backup Error", f"Could not save backup file.\nError: {e}")


    def _check_esp32_connection_loop(self):
        esp_addr = self.esp32_addr.get()
        url = f"{esp_addr.rstrip('/')}/api/check"

        self.esp32_connect_attempt_count += 1
        self.progress_bar['value'] = self.esp32_connect_attempt_count
        self._log(f"Attempt {self.esp32_connect_attempt_count}/{ESP32_CONNECT_ATTEMPTS}: Checking connection to ESP32...")

        connected = False
        try:
            res = requests.get(url, timeout=2)
            if res.status_code == 200:
                connected = True
        except requests.exceptions.RequestException:
            connected = False

        if connected:
            self._log("[Success] Connected to ESP32 device!")
            self.progress_bar['value'] = ESP32_CONNECT_ATTEMPTS
            self._embed_settings_on_device()
            return

        if self.esp32_connect_attempt_count < ESP32_CONNECT_ATTEMPTS:
            self.after_id = self.after(ESP32_CONNECT_WAIT_TIME_MS, self._check_esp32_connection_loop)
        else:
            self._log("[Error] Failed to connect to ESP32 device after maximum attempts.")
            if messagebox.askyesno("Connection Failed", "Failed to connect to the ESP32 device.\nPlease check power, WiFi connection, and address.\n\nDo you want to retry waiting?"):
                 self.esp32_connect_attempt_count = 0
                 self.progress_bar['value'] = 0
                 self.after_id = self.after(100, self._check_esp32_connection_loop) # Start immediately after click
            else:
                 self._log("[Error] ESP32 configuration incomplete. Settings were uploaded to server but not embedded on device.")
                 messagebox.showerror("Configuration Incomplete", "ESP32 configuration failed. Settings uploaded to server, but not embedded on device.")
                 self._re_enable_config_on_failure()


    def _embed_settings_on_device(self, retry=False):
        esp_addr = self.esp32_addr.get()
        url = f"{esp_addr.rstrip('/')}/api/config"

        device_payload = self.settings_dict.copy()
        if "business_id" in device_payload:
            del device_payload["business_id"]
        if "device_location" in device_payload:
            del device_payload["device_location"]
        if "password" not in device_payload and "password" in self.settings_dict:
             device_payload["password"] = self.settings_dict["password"]

        self._log("Embedding settings onto ESP32 device...")
        response = self._make_request(url, method="POST", json_payload=device_payload, timeout=15)

        if response and response.status_code == 200:
            self._log("[Success] Settings successfully embedded onto the device.")
            self._log("\n🎉 [COMPLETE] Device registration and configuration successful! 🎉")
            messagebox.showinfo("Success", "Device configuration completed successfully!")
            return True
        else:
            err_msg = "Failed to embed settings onto the ESP32 device."
            try:
                 err_details = response.json().get("message", "Unknown device error") if response else "No response"
                 err_msg += f"\nDevice Response: {err_details}"
            except:
                 err_msg += f"\nStatus Code: {response.status_code if response else 'N/A'}"
            self._log(f"[Error] {err_msg}")

            if not retry:
                 if messagebox.askyesno("Embedding Failed", f"{err_msg}\n\nDo you want to retry embedding?"):
                     return self._embed_settings_on_device(retry=True)
                 else:
                     self._log("[Error] Configuration incomplete. Settings uploaded but not embedded.")
                     messagebox.showerror("Configuration Incomplete", "ESP32 embedding failed. Settings uploaded to server, but not embedded on device.")
                     self._re_enable_config_on_failure()
                     return False
            else:
                self._log("[Error] Configuration incomplete after retry.")
                messagebox.showerror("Embedding Failed", f"{err_msg}\nEmbedding failed after retry.")
                self._re_enable_config_on_failure()
                return False

    def _re_enable_config_on_failure(self):
        self._log("Configuration process halted due to error. Re-enabling relevant inputs.")
        if self.token_validated:
             self._set_widget_state(self.config_frame, tk.NORMAL)
             self.generate_summary_btn.config(state=tk.NORMAL)
             self.proceed_btn.config(state=tk.DISABLED)
        self.validate_token_btn.config(state=tk.DISABLED if self.token_validated else tk.NORMAL)


if __name__ == "__main__":
    app = EspConfiguratorApp()
    app.mainloop()
