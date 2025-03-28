#include "config_storage.h"

#include <stdbool.h>
#include <stdint.h>
#include <stdlib.h>

#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "nvs.h"
#include "nvs_flash.h"

static const char* TAG = "config_storage";

static config_status_t load_string_value(nvs_handle_t handle, const char* key, char** output) {
	size_t required_size;
	esp_err_t err;

	err = nvs_get_str(handle, key, NULL, &required_size);
	if (err != ESP_OK) {
		ESP_LOGE(TAG, "Error getting %s: %s", key, esp_err_to_name(err));
		return CONFIG_STATUS_ERROR;
	}

	*output = malloc(required_size);
	if (*output == NULL) {
		ESP_LOGE(TAG, "Failed to allocate memory for %s.", key);
		return CONFIG_STATUS_ERROR;
	}

	err = nvs_get_str(handle, key, *output, &required_size);
	if (err != ESP_OK) {
		ESP_LOGE(TAG, "Error getting %s: %s", key, esp_err_to_name(err));
		free(*output);
		*output = NULL;
		return CONFIG_STATUS_ERROR;
	}

	return CONFIG_STATUS_OK;
}

config_status_t config_init(nvs_handle_t* handle) {
	esp_err_t err = nvs_flash_init();

	uint8_t err_count = 0;
	while (err == ESP_ERR_NVS_NO_FREE_PAGES || err == ESP_ERR_NVS_NEW_VERSION_FOUND) {
		ESP_LOGE(TAG, "NVS partition is full or outdated. Erasing and reinitializing: %s",
				 esp_err_to_name(err));
		nvs_flash_erase();

		err = nvs_flash_init();
		err_count += 1;
		if (err_count == 5) {
			ESP_LOGE(TAG, "Failed to initialize NVS repeatedly.");
			return CONFIG_STATUS_ERROR;
		}

		vTaskDelay(500 / portTICK_PERIOD_MS);
	}

	if (err != ESP_OK) {
		ESP_LOGE(TAG, "Failed to initialize NVS: %s", esp_err_to_name(err));
		return CONFIG_STATUS_ERROR;
	}

	err = nvs_open("config", NVS_READWRITE, handle);
	if (err != ESP_OK) {
		ESP_LOGE(TAG, "Failed to open \"config\" on NVS: %s", esp_err_to_name(err));
		return CONFIG_STATUS_ERROR;
	}

	ESP_LOGI(TAG, "Initialized successfully.");
	return CONFIG_STATUS_OK;
}

config_status_t config_load(nvs_handle_t handle, config_t* config) {
	/* API Key */
	if (load_string_value(handle, "api_key", &config->api_key) == CONFIG_STATUS_ERROR)
		return CONFIG_STATUS_ERROR;

	/* Wi-Fi SSID */
	if (load_string_value(handle, "ssid", &config->ssid) == CONFIG_STATUS_ERROR)
		return CONFIG_STATUS_ERROR;

	/* Wi-Fi Password */
	if (load_string_value(handle, "password", &config->password) == CONFIG_STATUS_ERROR)
		return CONFIG_STATUS_ERROR;

	/* Sensors */
	uint8_t motion, sound, gas, fire;

	nvs_get_u8(handle, "motion", &motion);
	nvs_get_u8(handle, "sound", &sound);
	nvs_get_u8(handle, "gas", &gas);
	nvs_get_u8(handle, "fire", &fire);

	config->motion = motion == 1;
	config->sound = sound == 1;
	config->gas = gas == 1;
	config->fire = fire == 1;

	return CONFIG_STATUS_OK;
}

config_status_t config_save(nvs_handle_t handle, config_t* config) {
	esp_err_t err;

	err = nvs_set_u8(handle, "configured", 1);
	if (err != ESP_OK) {
		ESP_LOGE(TAG, "Error setting configuration flag: %s", esp_err_to_name(err));
		return CONFIG_STATUS_ERROR;
	}

	err = nvs_set_str(handle, "api_key", config->api_key);
	if (err != ESP_OK) {
		ESP_LOGE(TAG, "Error setting api_key: %s", esp_err_to_name(err));
		return CONFIG_STATUS_ERROR;
	}

	err = nvs_set_str(handle, "ssid", config->ssid);
	if (err != ESP_OK) {
		ESP_LOGE(TAG, "Error setting Wi-Fi SSID: %s", esp_err_to_name(err));
		return CONFIG_STATUS_ERROR;
	}

	err = nvs_set_str(handle, "password", config->password);
	if (err != ESP_OK) {
		ESP_LOGE(TAG, "Error setting Wi-Fi password: %s", esp_err_to_name(err));
		return CONFIG_STATUS_ERROR;
	}

	err = nvs_set_u8(handle, "motion", config->motion);
	if (err != ESP_OK) {
		ESP_LOGE(TAG, "Error setting motion detection: %s", esp_err_to_name(err));
		return CONFIG_STATUS_ERROR;
	}

	err = nvs_set_u8(handle, "sound", config->sound);
	if (err != ESP_OK) {
		ESP_LOGE(TAG, "Error setting sound detection: %s", esp_err_to_name(err));
		return CONFIG_STATUS_ERROR;
	}

	err = nvs_set_u8(handle, "gas", config->gas);
	if (err != ESP_OK) {
		ESP_LOGE(TAG, "Error setting gas detection: %s", esp_err_to_name(err));
		return CONFIG_STATUS_ERROR;
	}

	err = nvs_set_u8(handle, "fire", config->fire);
	if (err != ESP_OK) {
		ESP_LOGE(TAG, "Error setting fire detection: %s", esp_err_to_name(err));
		return CONFIG_STATUS_ERROR;
	}

	err = nvs_commit(handle);
	if (err != ESP_OK) {
		ESP_LOGE(TAG, "Error committing configuration: %s", esp_err_to_name(err));
		return CONFIG_STATUS_ERROR;
	}

	return CONFIG_STATUS_OK;
}

bool is_configured(nvs_handle_t handle) {
	uint8_t configured;
	esp_err_t err = nvs_get_u8(handle, "configured", &configured);
	return err == ESP_OK && configured == 1;
}

void config_close(config_t** config) {
	if (config == NULL || *config == NULL) {
		return;
	}

	if ((*config)->api_key != NULL) {
		free((*config)->api_key);
		(*config)->api_key = NULL;
	}

	if ((*config)->ssid != NULL) {
		free((*config)->ssid);
		(*config)->ssid = NULL;
	}

	if ((*config)->password != NULL) {
		free((*config)->password);
		(*config)->password = NULL;
	}

	free(*config);
	*config = NULL;
}
