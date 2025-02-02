#include <stdio.h>
#include <stdlib.h>

#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

#include "nvs_flash.h"
#include "nvs.h"

#include "esp_log.h"

#include "config_storage.h"


void boot();

void app_main(void) {
    boot();

    while(true) {
        vTaskDelay(1000 / portTICK_PERIOD_MS);
    }
}

void boot() {
    const char* TAG = "software_boot";

    /* Configuration Storage */
    ESP_LOGI(TAG, "Confiugration Storage Section");

    config_t* device_configuration = malloc(sizeof(config_t));
    if (device_configuration == NULL) {
        ESP_LOGE(TAG, "Failed to allocate memory for device_configuration");
    }
    
    device_configuration->api_key = NULL;
    device_configuration->ssid = NULL;
    device_configuration->password = NULL;

    nvs_handle_t nvs_handle;

    if (config_init(&nvs_handle) == CONFIG_STATUS_ERROR) {
        ESP_LOGE(TAG, "Confiugration Storage failed. Boot sequence exit.");
        return;
    }

    if (is_configured(nvs_handle)) {
        ESP_LOGI(TAG, "Device configured. Loading data from NVS.");

        if (config_load(nvs_handle, device_configuration) == CONFIG_STATUS_ERROR) {
            ESP_LOGE(TAG, "Failed to load configuration from NVS. Boot sequence exit.");
            return;
        }
        
        ESP_LOGI(TAG, "API key: %s", device_configuration->api_key);
        ESP_LOGI(TAG, "Wi-Fi SSID: %s", device_configuration->ssid);
        ESP_LOGI(TAG, "Wi-Fi password: %s", device_configuration->password);
        ESP_LOGI(TAG, "Motion sensor: %s", (device_configuration->motion) ? "active" : "not active");
        ESP_LOGI(TAG, "Sound sensor: %s", (device_configuration->sound) ? "active" : "not active");
        ESP_LOGI(TAG, "Gas sensor: %s", (device_configuration->gas) ? "active" : "not active");
        ESP_LOGI(TAG, "Fire sensor: %s", (device_configuration->fire) ? "active" : "not active");

    } else {
        ESP_LOGI(TAG, "Device not configured. Starting in AP mode.");
    }

    nvs_close(nvs_handle);

    config_close(device_configuration);
}