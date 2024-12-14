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

#pragma once

#include "esp_log.h"
#include "esp_event.h"
#include "esp_http_server.h"
#include "nvs_flash.h"
#include "nvs.h"

#define     DEBUG_MODE                          1

#define     CONFIGURATION_OK                    0
#define     CONFIGURATION_ERROR                 1
#define     CONFIGURATION_IN_PROCESS            2

#define     CONFIGURATION_AP_SSID               "ESP32"
#define     CONFIGURATION_AP_PASSWORD           "admin1234"
#define     CONFIGURATION_AP_CHANNEL            6
#define     CONFIGURATION_AP_MAX_CONNECTIONS    1
#define     CONFIGURATION_SSID_HIDDEN           0

#define     MOTION_EVENT_REQUIRED_TRIGGERS      2
#define     MOTION_EVENT_TIMEFRAME_TRIGGERS     20000

#ifdef DEBUG_MODE
    #define     LOGI(tag, message, ...) ESP_LOGI(tag, message, ##__VA_ARGS__);
#else
    #define     LOGI(tag, text)
#endif

class Configuration {
    public:
        Configuration();
        ~Configuration();
        uint8_t getFlag();

    private:
        nvs_handle_t m_nvs_handle;
        uint8_t m_flag;
        httpd_handle_t m_server;

        bool m_is_configured();
        void m_setup();
        void m_start_ap();
        void m_start_webserver();
        void m_load();

        esp_err_t static m_post_config_handler(httpd_req_t* request);
        esp_err_t static m_get_check_connection_handler(httpd_req_t* request);

        void static m_wifi_event_handler(
            void* arg, 
            esp_event_base_t event_base, 
            int32_t event_id, 
            void* event_data);
};