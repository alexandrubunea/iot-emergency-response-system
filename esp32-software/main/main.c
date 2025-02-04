#include <stdio.h>
#include <stdlib.h>

#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

#include "nvs_flash.h"
#include "nvs.h"

#include "esp_wifi.h"

#include "esp_http_server.h"

#include "esp_log.h"

#include "config_storage.h"
#include "wifi_manager.h"
#include "config_server.h"


esp_err_t boot(config_t* device_configuration);
void print_config(config_t* config);

void app_main(void) {
    const char* TAG = "app_main";

    config_t* device_configuration = malloc(sizeof(config_t));
    if (device_configuration == NULL) {
        ESP_LOGE(TAG, "Failed to allocate memory for device_configuration.");
        return;
    }

    if (boot(device_configuration) != ESP_OK)
        return;

    while(true) {
        vTaskDelay(1000 / portTICK_PERIOD_MS);
    }
}

esp_err_t boot(config_t* device_configuration) {
    const char* TAG = "software_boot";
    wifi_mode_t wifi_mode;

    /* Configuration Storage */
    ESP_LOGI(TAG, "Confiugration Storage Section");
    
    device_configuration->api_key = NULL;
    device_configuration->ssid = NULL;
    device_configuration->password = NULL;

    nvs_handle_t nvs_handle;

    if (config_init(&nvs_handle) == CONFIG_STATUS_ERROR) {
        ESP_LOGE(TAG, "Confiugration Storage failed. Boot sequence exit.");
        return ESP_FAIL;
    }

    if (is_configured(nvs_handle)) {
        ESP_LOGI(TAG, "Device configured. Loading data from NVS.");

        if (config_load(nvs_handle, device_configuration) == CONFIG_STATUS_ERROR) {
            ESP_LOGE(TAG, "Failed to load configuration from NVS. Boot sequence exit.");
            return ESP_FAIL;
        }

        wifi_mode = WIFI_MODE_STA;
    } else {
        ESP_LOGI(TAG, "Device not configured. Starting in AP mode.");

        wifi_mode = WIFI_MODE_AP;
    }

    /* Wi-Fi Manager */
    if (wifi_init(wifi_mode, device_configuration->ssid, device_configuration->ssid, WIFI_AP_SSID, WIFI_AP_PASS) == WIFI_STATUS_ERROR) {
        ESP_LOGE(TAG, "Failed to initialize wifi_manager. Boot sequence exit.");

        return ESP_FAIL;
    }

    if (wifi_mode == WIFI_MODE_STA) {
        ESP_LOGI(TAG, "Boot sequence complete.");
        nvs_close(nvs_handle);
        print_config(device_configuration);

        return ESP_OK;
    }

    /* Configuration Server */
    httpd_handle_t httpd_handle = config_server_init(device_configuration);
    if (httpd_handle == NULL) {
        ESP_LOGE(TAG, "Failed to initialize config_server. Boot sequence exit.");

        return ESP_FAIL;
    }

    wait_for_configuration(5);

    /* Save Configuration & Restart ESP32 */
    config_save(nvs_handle, device_configuration);
    print_config(device_configuration);

    httpd_stop(httpd_handle);
    nvs_close(nvs_handle);
    config_close(device_configuration);

    esp_restart();

    return ESP_OK;
}

void print_config(config_t* config) {
    const char* TAG = "config";

    ESP_LOGI(TAG, "API key: %s", config->api_key);
    ESP_LOGI(TAG, "Wi-Fi SSID: %s", config->ssid);
    ESP_LOGI(TAG, "Wi-Fi password: %s", config->password);
    ESP_LOGI(TAG, "Motion sensor: %s", (config->motion) ? "active" : "not active");
    ESP_LOGI(TAG, "Sound sensor: %s", (config->sound) ? "active" : "not active");
    ESP_LOGI(TAG, "Gas sensor: %s", (config->gas) ? "active" : "not active");
    ESP_LOGI(TAG, "Fire sensor: %s", (config->fire) ? "active" : "not active");
}