#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>

#include "config_server.h"
#include "config_storage.h"
#include "esp_http_server.h"
#include "esp_log.h"
#include "esp_wifi.h"
#include "fire_sensor.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "motion_sensor.h"
#include "nvs.h"
#include "nvs_flash.h"
#include "sound_sensor.h"
#include "wifi_manager.h"

/* ESP32 Configuration */
#define CONFIG_WAIT_TIME_SECONDS 5
#define WAIT_TIME_BEFORE_REBOOT 5
#define GENERIC_DELAY_TIME 5

#define WIFI_AP_SSID "ESP32"
#define WIFI_AP_PASS "admin1234"

/* Function prototypes */
config_t* allocate_configuration();
bool read_flash_memory(nvs_handle_t handle);
esp_err_t boot_sequence(config_t** device_cfg);
void print_config(config_t* config);

/* Main app */
void app_main(void) {
	config_t* device_cfg;

	if (boot_sequence(&device_cfg) != ESP_OK) return;

	if (init_motion_sensor() != ESP_OK) {
		ESP_LOGE("app_main", "Failed to initialize motion sensor. Turning off.");
		return;
	}

	if (init_sound_sensor() != ESP_OK) {
		ESP_LOGE("app_main", "Failed to initialize sound sensor. Turning off.");
		return;
	}

	if (init_fire_sensor() != ESP_OK) {
		ESP_LOGE("app_main", "Failed to initialize fire sensor. Turning off.");
		return;
	}

	while (true) {
		vTaskDelay(1000 / portTICK_PERIOD_MS);
	}
}

esp_err_t boot_sequence(config_t** device_cfg) {
	const char* TAG = "boot";

	/* Allocate necessary resources to boot */
	*device_cfg = allocate_configuration();
	nvs_handle_t nvs_handle;
	httpd_handle_t httpd_handle = NULL;
	wifi_mode_t wifi_mode;
	esp_err_t boot_status = ESP_OK;
	bool device_configured;
	bool freshly_configured = false;

	/* Check if device_cfg was initialized properly */
	if (*device_cfg == NULL) goto error;

	/* Init flash memory */
	if (config_init(&nvs_handle) == CONFIG_STATUS_ERROR) goto error;

	/* Check if config exists on flash memory */
	device_configured = is_configured(nvs_handle);

	/* Loads the configuration if the device is configured */
	if (device_configured && config_load(nvs_handle, *device_cfg) == CONFIG_STATUS_ERROR)
		goto error;

	/* Decide in which mode to start the wifi_manager */
	wifi_mode = (device_configured) ? WIFI_MODE_STA : WIFI_MODE_AP;

	/* Init wifi_manager */
	if (wifi_init(wifi_mode, (*device_cfg)->ssid, (*device_cfg)->password, WIFI_AP_SSID,
				  WIFI_AP_PASS) == WIFI_STATUS_ERROR)
		goto error;

	/* If the wifi_mode is set to STA, then is no need for the config_server */
	if (wifi_mode == WIFI_MODE_STA) goto success;

	/* Init config_server */
	httpd_handle = config_server_init(*device_cfg);
	if (httpd_handle == NULL) goto error;

	/* Wait for the ESP32 to be configured */
	wait_for_configuration(CONFIG_WAIT_TIME_SECONDS);

	/* Save the received configuration */
	config_save(nvs_handle, *device_cfg);

	/* Mark the fact that this device was freshly configured */
	freshly_configured = true;

	/* Boot sequence complete */
success:
	vTaskDelay((1000 * GENERIC_DELAY_TIME) / portTICK_PERIOD_MS);  // Delay because the Wi-Fi client
																   // needs a little bit to connect
	print_config(*device_cfg);
	ESP_LOGI(TAG, "Boot sequence complete.");
	goto free_resources;

error:
	ESP_LOGE(TAG, "Error occured during boot sequence. Device unable to boot.");
	boot_status = ESP_FAIL;
	freshly_configured = false;
	if (*device_cfg != NULL) config_close(device_cfg);

free_resources:
	if (nvs_handle) nvs_close(nvs_handle);
	if (httpd_handle) httpd_stop(httpd_handle);

	/* Restart the device if it was freshly configured. */
	if (freshly_configured) {
		if (*device_cfg == NULL)  // This shouldn't happen, but it's better to be safe...
			goto error;

		config_close(device_cfg);

		ESP_LOGI(TAG, "This device was freshly configured and will reboot in %d seconds...",
				 WAIT_TIME_BEFORE_REBOOT);
		vTaskDelay((1000 * WAIT_TIME_BEFORE_REBOOT) / portTICK_PERIOD_MS);

		esp_restart();
	}

	return boot_status;
}

config_t* allocate_configuration() {
	config_t* config = malloc(sizeof(config_t));
	if (config == NULL) {
		ESP_LOGE("config", "Failed to allocate memory for ESP32 configurtion.");
		return NULL;
	}

	config->api_key = NULL;
	config->ssid = NULL;
	config->password = NULL;
	config->motion = false;
	config->sound = false;
	config->gas = false;
	config->fire = false;

	return config;
}

void print_config(config_t* config) {
	const char* TAG = "config";

	if (config == NULL) {
		ESP_LOGE(TAG, "Configuration is null. Data can't be displayed.");
		return;
	}

	ESP_LOGI(TAG, "API key: %s", config->api_key);
	ESP_LOGI(TAG, "Wi-Fi SSID: %s", config->ssid);
	ESP_LOGI(TAG, "Wi-Fi password: %s", config->password);
	ESP_LOGI(TAG, "Motion sensor: %s", (config->motion) ? "active" : "not active");
	ESP_LOGI(TAG, "Sound sensor: %s", (config->sound) ? "active" : "not active");
	ESP_LOGI(TAG, "Gas sensor: %s", (config->gas) ? "active" : "not active");
	ESP_LOGI(TAG, "Fire sensor: %s", (config->fire) ? "active" : "not active");
}
