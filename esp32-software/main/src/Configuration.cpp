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
}

void Configuration::m_start_ap() {
    esp_err_t err;

    err = esp_netif_init();
    if (err != ESP_OK && err != ESP_ERR_INVALID_STATE) {
        LOGI("Configuration", "Error initializing TCP/IP stack: %s", esp_err_to_name(err));
        m_flag = CONFIGURATION_ERROR;
        return;
    }

    wifi_init_config_t wifi_init_cfg = WIFI_INIT_CONFIG_DEFAULT();
    err = esp_wifi_init(&wifi_init_cfg);
    if (err != ESP_OK) {
        LOGI("Configuration", "Error initializing WiFi driver: %s", esp_err_to_name(err));
        m_flag = CONFIGURATION_ERROR;
        return;
    }

    err = esp_event_loop_create_default();
    if (err != ESP_OK) {
        LOGI("Configuration", "Error creating default event loop: %s", esp_err_to_name(err));
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
        LOGI("Configuration", "Error registering WiFi event handler: %s", esp_err_to_name(err));
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
            .ssid_hidden = 0,
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
        LOGI("Configuration", "Error setting WiFi AP configuration: %s", esp_err_to_name(err));
        m_flag = CONFIGURATION_ERROR;
        return;
    }

    err = esp_wifi_set_mode(WIFI_MODE_AP);
    if(err != ESP_OK) {
        LOGI("Configuration", "Error setting WiFi mode to AP: %s", esp_err_to_name(err));
        m_flag = CONFIGURATION_ERROR;
        return;
    }

    err = esp_wifi_start();
    if(err != ESP_OK) {
        LOGI("Configuration", "Error starting WiFi AP: %s", esp_err_to_name(err));
        m_flag = CONFIGURATION_ERROR;
        return;
    }
}

uint8_t Configuration::getFlag() {
    return m_flag;
}

void Configuration::m_wifi_event_handler(
    void* arg, 
    esp_event_base_t event_base, 
    int32_t event_id, 
    void* event_data) {

    if (event_id == WIFI_EVENT_AP_STACONNECTED) {
        LOGI("Configuration", "Station connected to AP");
    } else if (event_id == WIFI_EVENT_AP_STADISCONNECTED) {
        LOGI("Configuration", "Station disconnected from AP");
    }
}