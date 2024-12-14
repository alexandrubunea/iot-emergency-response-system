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
#include "esp_netif.h"
#include "lwip/inet.h"
#include "cJSON.h"

Configuration::Configuration() {
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
    nvs_close(m_nvs_handle);
    if(m_server) httpd_stop(m_server);
}


uint8_t Configuration::getFlag() {
    return m_flag;
}

bool Configuration::m_is_configured() {
    uint8_t configured = false;
    esp_err_t err;

    err = nvs_get_u8(m_nvs_handle, "configured", &configured);
    
    return err != ESP_OK;
}

void Configuration::m_load() {

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
        .handler = m_post_config_handler,
        .user_ctx = NULL
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

esp_err_t Configuration::m_post_config_handler(httpd_req_t* request) {
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
    if (cJSON_IsString(hash_id)) {
        LOGI("WebServer", "Hash ID: %s", hash_id->valuestring);
    } else {
        LOGI("WebServer", "Hash ID not found");
    }

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
        LOGI("Access Point", "Error initializing WiFi driver: %s", esp_err_to_name(err));
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
        LOGI("Access Point", "Error registering WiFi event handler: %s", esp_err_to_name(err));
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
        LOGI("Access Point", "Error setting WiFi AP configuration: %s", esp_err_to_name(err));
        m_flag = CONFIGURATION_ERROR;
        return;
    }

    err = esp_wifi_set_mode(WIFI_MODE_AP);
    if(err != ESP_OK) {
        LOGI("Access Point", "Error setting WiFi mode to AP: %s", esp_err_to_name(err));
        m_flag = CONFIGURATION_ERROR;
        return;
    }

    esp_netif_t *ap_netif = esp_netif_create_default_wifi_ap();

    err = esp_netif_dhcps_stop(ap_netif);
    if (err != ESP_OK) {
        ESP_LOGE("Access Point", "Failed to stop DHCP server: %s", esp_err_to_name(err));
        return;
    }

    esp_netif_ip_info_t ip_info;
    IP4_ADDR(&ip_info.ip, 192, 168, 4, 1);
    IP4_ADDR(&ip_info.gw, 192, 168, 4, 1);
    IP4_ADDR(&ip_info.netmask, 255, 255, 255, 0);

    err = esp_netif_set_ip_info(ap_netif, &ip_info);
    if (err != ESP_OK) {
        LOGI("Access Point", "Error setting static IP for AP: %s", esp_err_to_name(err));
        m_flag = CONFIGURATION_ERROR;
        return;
    }

    err = esp_netif_dhcps_start(ap_netif);
    if (err != ESP_OK) {
        LOGI("Access Point", "Error starting DHCP server: %s", esp_err_to_name(err));
        m_flag = CONFIGURATION_ERROR;
        return;
    }

    err = esp_wifi_start();
    if(err != ESP_OK) {
        LOGI("Access Point", "Error starting WiFi AP: %s", esp_err_to_name(err));
        m_flag = CONFIGURATION_ERROR;
        return;
    }

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