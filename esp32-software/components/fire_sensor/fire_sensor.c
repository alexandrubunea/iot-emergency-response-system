#include "fire_sensor.h"

#include "current_monitor.h"
#include "esp_err.h"
#include "esp_http_client.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "ina219.h"
#include "sensor.h"
#include "utils.h"

const static char* TAG = "fire_sensor";

// cppcheck-suppress constParameterCallback
static void fire_sensor_event(void* pvParameters) {
	Sensor* fire_sensor = (Sensor*)pvParameters;

	while (true) {
		int value = read_signal(fire_sensor);
		current_monitor_data current_data;

		esp_err_t err = read_current_monitor_data(&fire_sensor->current_monitor, &current_data);
		if (err != ESP_OK) {
			ESP_LOGE(TAG, "Failed to read current monitor data: %s", esp_err_to_name(err));
			continue;
		}

		if (current_data.power_mw < 7.50) {
			ESP_LOGI(TAG, "Power consumption is too low. Sensor might be malfunctioning.");
			send_malfunction(fire_sensor->device_cfg->api_key, "fire_sensor",
							 "Power consumption is too low. Sensor might be malfunctioning.");

			vTaskDelay(5000 / portTICK_PERIOD_MS);

			continue;
		}

		if (current_data.current_ma < 1.50) {
			ESP_LOGI(TAG, "Current consumption is too low. Sensor might be malfunctioning.");
			send_malfunction(fire_sensor->device_cfg->api_key, "fire_sensor",
							 "Current consumption is too low. Sensor might be malfunctioning.");

			vTaskDelay(5000 / portTICK_PERIOD_MS);

			continue;
		}

		if (value != -1 && value <= fire_sensor->treshold) {
			fire_sensor->times_triggered++;
			ESP_LOGI(TAG, "Fire detected. Times triggered: %d", fire_sensor->times_triggered);

			if (fire_sensor->times_triggered >= fire_sensor->times_to_trigger) {
				ESP_LOGI(TAG, "Fire detected %d times. Triggering alarm.",
						 fire_sensor->times_to_trigger);
				fire_sensor->times_triggered = 0;

				send_alert(fire_sensor->device_cfg->api_key, "fire_alert", NULL);
			}
		}

		if (fire_sensor->times_triggered > 0) {
			fire_sensor->reset_ticks_count++;

			if (fire_sensor->reset_ticks_count >= fire_sensor->required_reset_ticks) {
				ESP_LOGI(TAG, "Inactivity detected. Resetting sensor trigger.");
				fire_sensor->reset_ticks_count = 0;
				fire_sensor->times_triggered = 0;
			}
		}

		vTaskDelay(500 / portTICK_PERIOD_MS);
	}
}

esp_err_t init_fire_sensor(int gpio, bool is_digital, int treshold, int times_to_trigger,
						   config_t* device_cfg, uint8_t monitor_i2c_addr) {
	ina219_dev_t current_monitor;

	esp_err_t err = init_current_monitor(&current_monitor, monitor_i2c_addr);
	if (err != ESP_OK) {
		ESP_LOGE(TAG, "Failed to initialize current monitor for fire sensor.");
		return err;
	}

	Sensor* fire_sensor =
		init_sensor(gpio, is_digital, treshold, times_to_trigger, 10, device_cfg, current_monitor);

	if (fire_sensor == NULL) {
		ESP_LOGE(TAG, "Failed to allocate memory for the sensor.");
		return ESP_ERR_NO_MEM;
	}

	// cppcheck-suppress constParameterCallback
	xTaskCreate(fire_sensor_event, "FIRE SENSOR", FIRE_SENSOR_STACK_SIZE, (void*)fire_sensor,
				FIRE_SENSOR_PRIORITY, NULL);

	ESP_LOGI(TAG, "Task for fire sensor created.");

	return ESP_OK;
}
