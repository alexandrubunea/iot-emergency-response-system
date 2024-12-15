/*
 Copyright 2024 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

#include "Configuration.hpp"

#include <string.h>

#include "esp_wifi.h"
#include "lwip/inet.h"
#include "cJSON.h"

Configuration::Configuration() {
    m_wifi_ap_running = false;

    esp_err_t err;

    err = nvs_flash_init();
    if (err == ESP_ERR_NVS_NO_FREE_PAGES || err == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        LOGI("Configuration", "NVS partition is full or outdated. Erasing and reinitializing: %s", esp_err_to_name(err));
        nvs_flash_erase();
        err = nvs_flash_init();
    }

    if (err != ESP_OK) {
        LOGI("Configuration", "Failed to initialize NVS: %s", esp_err_to_name(err));
        m_flag = CONFIGURATION_ERROR;
        return;
    }

    err = nvs_open("config", NVS_READONLY, &m_nvs_handle);
    if(m_is_configured()) {
        LOGI("Configuration", "Configuration not found, ESP32 starting in AP mode");
        LOGI("Configuration", "Please connect to the ESP32 AP and configure the device");

        m_setup();
    } else {
        LOGI("Configuration", "Configuration found, ESP32 starting in STA mode");
    
        m_load();
    }
}

Configuration::~Configuration() {
    if(m_flag == CONFIGURATION_IN_PROCESS || m_flag == CONFIGURATION_ERROR) {
        m_stop_setup();
    }

    if(m_hash_id) {
        free(m_hash_id);
        m_hash_id = nullptr;
    }
    if(m_ssid) { 
        free(m_ssid);
        m_ssid = nullptr;
    }
    if(m_password){
        free(m_password);
        m_password = nullptr;
    }
}

/***********
 * Getters *
 ***********/
uint8_t Configuration::getFlag() {
    return m_flag;
}
const char* Configuration::getHashId() {
    return m_hash_id;
}
bool Configuration::getMotionDetection() {
    return m_motion_detection;
}
bool Configuration::getSoundDetection() {
    return m_sound_detection;
}
bool Configuration::getGasDetection() {
    return m_gas_detection;
}
bool Configuration::getFireDetection() {
    return m_fire_detection;
}

/**************************
 * Configuration Handling *
 **************************/
bool Configuration::m_is_configured() {
    uint8_t configured = false;
    esp_err_t err;

    err = nvs_get_u8(m_nvs_handle, "configured", &configured);
    
    return err != ESP_OK;
}

void Configuration::m_write_config(
    const char* hash_id,
    const char* ssid, 
    const char* password, 
    uint8_t motion_detection,
    uint8_t sound_detection,
    uint8_t gas_detection,
    uint8_t fire_detection
) {
    esp_err_t err;

    err = nvs_set_u8(m_nvs_handle, "configured", 1);
    if(err != ESP_OK) {
        LOGI("Configuration", "Error setting configuration flag: %s", esp_err_to_name(err));
        m_flag = CONFIGURATION_ERROR;
        return;
    }

    err = nvs_set_str(m_nvs_handle, "hash_id", hash_id);
    if(err != ESP_OK) {
        LOGI("Configuration", "Error setting hash ID: %s", esp_err_to_name(err));
        m_flag = CONFIGURATION_ERROR;
        return;
    }

    err = nvs_set_str(m_nvs_handle, "wifi_ssid", ssid);
    if(err != ESP_OK) {
        LOGI("Configuration", "Error setting Wi-Fi SSID: %s", esp_err_to_name(err));
        m_flag = CONFIGURATION_ERROR;
        return;
    }

    err = nvs_set_str(m_nvs_handle, "wifi_pass", password);
    if(err != ESP_OK) {
        LOGI("Configuration", "Error setting Wi-Fi password: %s", esp_err_to_name(err));
        m_flag = CONFIGURATION_ERROR;
        return;
    }

    err = nvs_set_u8(m_nvs_handle, "motion_detect", motion_detection);
    if(err != ESP_OK) {
        LOGI("Configuration", "Error setting motion detection: %s", esp_err_to_name(err));
        m_flag = CONFIGURATION_ERROR;
        return;
    }

    err = nvs_set_u8(m_nvs_handle, "sound_detect", sound_detection);
    if(err != ESP_OK) {
        LOGI("Configuration", "Error setting sound detection: %s", esp_err_to_name(err));
        m_flag = CONFIGURATION_ERROR;
        return;
    }

    err = nvs_set_u8(m_nvs_handle, "gas_detect", gas_detection);
    if(err != ESP_OK) {
        LOGI("Configuration", "Error setting gas detection: %s", esp_err_to_name(err));
        m_flag = CONFIGURATION_ERROR;
        return;
    }

    err = nvs_set_u8(m_nvs_handle, "fire_detect", fire_detection);
    if(err != ESP_OK) {
        LOGI("Configuration", "Error setting fire detection: %s", esp_err_to_name(err));
        m_flag = CONFIGURATION_ERROR;
        return;
    }

    err = nvs_commit(m_nvs_handle);
    if(err != ESP_OK) {
        LOGI("Configuration", "Error committing configuration: %s", esp_err_to_name(err));
        m_flag = CONFIGURATION_ERROR;
        return;
    }

    m_load();
    m_stop_setup();

    m_flag = CONFIGURATION_COMPLETED;
}

void Configuration::m_load() {
    esp_err_t err;
    size_t required_size;
    uint8_t motion_detection, sound_detection, gas_detection, fire_detection;

    m_hash_id = nullptr;
    m_ssid = nullptr;
    m_password = nullptr;
    m_motion_detection = false;
    m_sound_detection = false;
    m_gas_detection = false;
    m_fire_detection = false;

    err = nvs_get_str(m_nvs_handle, "hash_id", NULL, &required_size);
    if(err != ESP_OK) {
        LOGI("Configuration", "Error getting hash ID: %s", esp_err_to_name(err));
        m_flag = CONFIGURATION_ERROR;
        return;
    }
    m_hash_id = (char*) malloc(required_size);
    if(m_hash_id == NULL) {
        LOGI("Configuration", "Error allocating memory for hash ID");
        m_flag = CONFIGURATION_ERROR;
        return;
    }
    err = nvs_get_str(m_nvs_handle, "hash_id", m_hash_id, &required_size);
    if(err != ESP_OK) {
        LOGI("Configuration", "Error getting hash ID: %s", esp_err_to_name(err));
        free(m_hash_id);
        m_hash_id = nullptr;
        m_flag = CONFIGURATION_ERROR;
        return;
    }
    LOGI("Configuration", "Hash ID: %s", m_hash_id);

    err = nvs_get_str(m_nvs_handle, "wifi_ssid", NULL, &required_size);
    if(err != ESP_OK) {
        LOGI("Configuration", "Error getting Wi-Fi SSID: %s", esp_err_to_name(err));
        m_flag = CONFIGURATION_ERROR;
        return;
    }
    m_ssid = (char*) malloc(required_size);
    if(m_ssid == NULL) {
        LOGI("Configuration", "Error allocating memory for Wi-Fi SSID");
        m_flag = CONFIGURATION_ERROR;
        return;
    }
    err = nvs_get_str(m_nvs_handle, "wifi_ssid", m_ssid, &required_size);
    if(err != ESP_OK) {
        LOGI("Configuration", "Error getting Wi-Fi SSID: %s", esp_err_to_name(err));
        free(m_ssid);
        m_ssid = nullptr;
        m_flag = CONFIGURATION_ERROR;
        return;
    }
    LOGI("Configuration", "Wi-Fi SSID: %s", m_ssid);

    err = nvs_get_str(m_nvs_handle, "wifi_pass", NULL, &required_size);
    if(err != ESP_OK) {
        LOGI("Configuration", "Error getting Wi-Fi password: %s", esp_err_to_name(err));
        m_flag = CONFIGURATION_ERROR;
        return;
    }
    m_password = (char*) malloc(required_size);
    if(m_password == NULL) {
        LOGI("Configuration", "Error allocating memory for Wi-Fi password");
        m_flag = CONFIGURATION_ERROR;
        return;
    }
    err = nvs_get_str(m_nvs_handle, "wifi_pass", m_password, &required_size);
    if(err != ESP_OK) {
        LOGI("Configuration", "Error getting Wi-Fi password: %s", esp_err_to_name(err));
        free(m_password);
        m_password = nullptr;
        m_flag = CONFIGURATION_ERROR;
        return;
    }
    LOGI("Configuration", "Wi-Fi Password: %s", m_password);

    nvs_get_u8(m_nvs_handle, "motion_detect", &motion_detection);
    nvs_get_u8(m_nvs_handle, "sound_detect", &sound_detection);
    nvs_get_u8(m_nvs_handle, "gas_detect", &gas_detection);
    nvs_get_u8(m_nvs_handle, "fire_detect", &fire_detection);

    m_motion_detection = motion_detection == 1;
    m_sound_detection = sound_detection == 1;
    m_gas_detection = gas_detection == 1;
    m_fire_detection = fire_detection == 1;

    LOGI("Configuration", "Motion Detection: %d", m_motion_detection);
    LOGI("Configuration", "Sound Detection: %d", m_sound_detection);
    LOGI("Configuration", "Gas Detection: %d", m_gas_detection);
    LOGI("Configuration", "Fire Detection: %d", m_fire_detection);

    nvs_close(m_nvs_handle);

    LOGI("Configuration", "Configuration loaded successfully");

    m_flag = CONFIGURATION_OK;
}

void Configuration::m_setup() {
    esp_err_t err;

    err = nvs_open("config", NVS_READWRITE, &m_nvs_handle);
    if(err != ESP_OK) {
        LOGI("Configuration", "Error opening NVS handle in setup mode: %s", esp_err_to_name(err));
        m_flag = CONFIGURATION_ERROR;
        return;
    }

    m_flag = CONFIGURATION_IN_PROCESS;

    m_start_ap();
    m_start_webserver();
}

void Configuration::m_stop_setup() {
    if(m_nvs_handle) nvs_close(m_nvs_handle);
    if(m_server) httpd_stop(m_server);
    if(m_wifi_ap_running){
        esp_netif_dhcpc_stop(m_ap_netif);
        esp_wifi_stop();
        esp_wifi_deinit();
        esp_netif_destroy(m_ap_netif);
        m_wifi_ap_running = false;
    } 
}

/*************
 * Webserver *
 *************/
void Configuration::m_start_webserver() {
    httpd_config_t config = HTTPD_DEFAULT_CONFIG();
    m_server = NULL;

    if(httpd_start(&m_server, &config) != ESP_OK) {
        LOGI("Configuration", "Error starting HTTP server");
        m_flag = CONFIGURATION_ERROR;
        return;
    }

    httpd_uri_t post_uri = {
        .uri = "/api/embed_settings",
        .method = HTTP_POST,
        .handler = [](httpd_req_t* request) -> esp_err_t {
            Configuration* current_instance = static_cast<Configuration*>(request->user_ctx);
            return current_instance->m_post_config_handler(request, current_instance);
        },
        .user_ctx = this
    };

    httpd_uri_t get_uri = {
        .uri = "/api/check_connection",
        .method = HTTP_GET,
        .handler = m_get_check_connection_handler,
        .user_ctx = NULL
    };

    httpd_register_uri_handler(m_server, &post_uri);
    httpd_register_uri_handler(m_server, &get_uri);
}

esp_err_t Configuration::m_post_config_handler(httpd_req_t* request, Configuration* configuration_instance) {
    char content[512];
    size_t content_length = request->content_len;
    int ret = httpd_req_recv(request, content, content_length);

    if(ret <= 0) {
        if(ret == HTTPD_SOCK_ERR_TIMEOUT) {
            httpd_resp_send_408(request);
        }

        return ESP_FAIL;
    }

    cJSON* root = cJSON_Parse(content);
    if(root == NULL) {
        LOGI("WebServer", "Error parsing JSON");
        httpd_resp_send_custom_err(request, "400", "Invalid JSON");
        return ESP_FAIL;
    }

    cJSON* hash_id = cJSON_GetObjectItem(root, "hash_id");
    cJSON* wifi_ssid = cJSON_GetObjectItem(root, "wifi_ssid");
    cJSON* wifi_password = cJSON_GetObjectItem(root, "wifi_password");
    cJSON* motion_detection = cJSON_GetObjectItem(root, "motion_detection");
    cJSON* sound_detection = cJSON_GetObjectItem(root, "sound_detection");
    cJSON* gas_detection = cJSON_GetObjectItem(root, "gas_detection");
    cJSON* fire_detection = cJSON_GetObjectItem(root, "fire_detection");

    if(hash_id == NULL || wifi_ssid == NULL || wifi_password == NULL || motion_detection == NULL || sound_detection == NULL || gas_detection == NULL || fire_detection == NULL) {
        LOGI("WebServer", "Missing required fields");
        httpd_resp_send_custom_err(request, "400", "Missing required fields");
        cJSON_Delete(root);
        return ESP_FAIL;
    }

    LOGI("WebServer", "Hash ID: %s", hash_id->valuestring);
    LOGI("WebServer", "Wi-Fi SSID: %s", wifi_ssid->valuestring);
    LOGI("WebServer", "Wi-Fi Password: %s", wifi_password->valuestring);
    LOGI("WebServer", "Motion Detection: %d", motion_detection->valueint);
    LOGI("WebServer", "Sound Detection: %d", sound_detection->valueint);
    LOGI("WebServer", "Gas Detection: %d", gas_detection->valueint);
    LOGI("WebServer", "Fire Detection: %d", fire_detection->valueint);

    configuration_instance->m_write_config(
        hash_id->valuestring,
        wifi_ssid->valuestring,
        wifi_password->valuestring,
        motion_detection->valueint,
        sound_detection->valueint,
        gas_detection->valueint,
        fire_detection->valueint
    );

    cJSON_Delete(root);

    const char* response = "{\"status\": \"sucesss\"}";

    httpd_resp_set_status(request, "200 OK");
    httpd_resp_set_type(request, "application/json");
    httpd_resp_send(request, response, strlen(response));

    return ESP_OK;
}

esp_err_t Configuration::m_get_check_connection_handler(httpd_req_t* request) {
    const char* response = "{\"status\": \"sucesss\"}";

    httpd_resp_set_status(request, "200 OK");
    httpd_resp_set_type(request, "application/json");
    httpd_resp_send(request, response, strlen(response));
    LOGI("WebServer", "Check connection");

    return ESP_OK;
}


/****************
 * Access Point *
 ****************/
void Configuration::m_start_ap() {
    esp_err_t err;

    err = esp_netif_init();
    if (err != ESP_OK && err != ESP_ERR_INVALID_STATE) {
        LOGI("Access Point", "Error initializing TCP/IP stack: %s", esp_err_to_name(err));
        m_flag = CONFIGURATION_ERROR;
        return;
    }

    wifi_init_config_t wifi_init_cfg = WIFI_INIT_CONFIG_DEFAULT();
    err = esp_wifi_init(&wifi_init_cfg);
    if (err != ESP_OK) {
        LOGI("Access Point", "Error initializing Wi-Fi driver: %s", esp_err_to_name(err));
        m_flag = CONFIGURATION_ERROR;
        return;
    }

    err = esp_event_loop_create_default();
    if (err != ESP_OK) {
        LOGI("Access Point", "Error creating default event loop: %s", esp_err_to_name(err));
        m_flag = CONFIGURATION_ERROR;
        return;
    }

    err = esp_event_handler_instance_register(
            WIFI_EVENT,
            ESP_EVENT_ANY_ID,
            &m_wifi_event_handler,
            NULL,
            NULL);
    if(err != ESP_OK) {
        LOGI("Access Point", "Error registering Wi-Fi event handler: %s", esp_err_to_name(err));
        m_flag = CONFIGURATION_ERROR;
        return;
    }

    wifi_config_t wifi_config = {
        .ap = {
            .ssid = CONFIGURATION_AP_SSID,
            .password = CONFIGURATION_AP_PASSWORD,
            .ssid_len = strlen(CONFIGURATION_AP_SSID),
            .channel = CONFIGURATION_AP_CHANNEL,
            .authmode = WIFI_AUTH_WPA3_PSK,
            .ssid_hidden = CONFIGURATION_SSID_HIDDEN,
            .max_connection = CONFIGURATION_AP_MAX_CONNECTIONS,
            .beacon_interval = 100,
            .csa_count = 0,
            .dtim_period = 2,
            .pairwise_cipher = WIFI_CIPHER_TYPE_CCMP,
            .ftm_responder = false,
            .pmf_cfg = {
                .capable = true,
                .required = true
            },
            .sae_pwe_h2e = WPA3_SAE_PWE_BOTH,
        }
    };

    err = esp_wifi_set_config(WIFI_IF_AP, &wifi_config);
    if(err != ESP_OK) {
        LOGI("Access Point", "Error setting Wi-Fi AP configuration: %s", esp_err_to_name(err));
        m_flag = CONFIGURATION_ERROR;
        return;
    }

    err = esp_wifi_set_mode(WIFI_MODE_AP);
    if(err != ESP_OK) {
        LOGI("Access Point", "Error setting Wi-Fi mode to AP: %s", esp_err_to_name(err));
        m_flag = CONFIGURATION_ERROR;
        return;
    }

    m_ap_netif = esp_netif_create_default_wifi_ap();

    err = esp_netif_dhcps_stop(m_ap_netif);
    if (err != ESP_OK) {
        ESP_LOGE("Access Point", "Failed to stop DHCP server: %s", esp_err_to_name(err));
        return;
    }

    esp_netif_ip_info_t ip_info;
    IP4_ADDR(&ip_info.ip, 192, 168, 4, 1);
    IP4_ADDR(&ip_info.gw, 192, 168, 4, 1);
    IP4_ADDR(&ip_info.netmask, 255, 255, 255, 0);

    err = esp_netif_set_ip_info(m_ap_netif, &ip_info);
    if (err != ESP_OK) {
        LOGI("Access Point", "Error setting static IP for AP: %s", esp_err_to_name(err));
        m_flag = CONFIGURATION_ERROR;
        return;
    }

    err = esp_netif_dhcps_start(m_ap_netif);
    if (err != ESP_OK) {
        LOGI("Access Point", "Error starting DHCP server: %s", esp_err_to_name(err));
        m_flag = CONFIGURATION_ERROR;
        return;
    }

    err = esp_wifi_start();
    if(err != ESP_OK) {
        LOGI("Access Point", "Error starting Wi-Fi AP: %s", esp_err_to_name(err));
        m_flag = CONFIGURATION_ERROR;
        return;
    }

    m_wifi_ap_running = true;

    LOGI("Access Point", "AP started successfully");
}

void Configuration::m_wifi_event_handler(
    void* arg, 
    esp_event_base_t event_base, 
    int32_t event_id, 
    void* event_data) {

    if (event_id == WIFI_EVENT_AP_STACONNECTED) {
        LOGI("Access Point", "Station connected to AP");
    } else if (event_id == WIFI_EVENT_AP_STADISCONNECTED) {
        LOGI("Access Point", "Station disconnected from AP");
    }
}