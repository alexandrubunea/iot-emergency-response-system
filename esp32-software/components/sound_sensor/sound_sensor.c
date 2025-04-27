#include "sound_sensor.h"

#include "current_monitor.h"
#include "esp_err.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "ina219.h"
#include "sensor.h"
#include "utils.h"

const static char* TAG = "sound_sensor";

// cppcheck-suppress constParameterCallback
static void sound_sensor_event(void* pvParameters) {
	Sensor* sound_sensor = (Sensor*)pvParameters;

	while (true) {
		int value = read_signal(sound_sensor);
		current_monitor_data current_data;

		esp_err_t err = read_current_monitor_data(&sound_sensor->current_monitor, &current_data);
		if (err != ESP_OK) {
			ESP_LOGE(TAG, "Failed to read current monitor data: %s", esp_err_to_name(err));
			continue;
		}

		if (current_data.power_mw < 20.00) {
			ESP_LOGI(TAG, "Power consumption is too low. Sensor might be malfunctioning.");
			send_malfunction(sound_sensor->device_cfg->api_key, "sound_sensor",
							 "Power consumption is too low. Sensor might be malfunctioning.");

			vTaskDelay(5000 / portTICK_PERIOD_MS);

			continue;
		}

		if (current_data.current_ma < 5.00) {
			ESP_LOGI(TAG, "Current consumption is too low. Sensor might be malfunctioning.");
			send_malfunction(sound_sensor->device_cfg->api_key, "sound_sensor",
							 "Current consumption is too low. Sensor might be malfunctioning.");

			vTaskDelay(5000 / portTICK_PERIOD_MS);

			continue;
		}

		if (value) {
			sound_sensor->times_triggered++;
			ESP_LOGI(TAG, "Sound detected. Times triggered: %d", sound_sensor->times_triggered);

			if (sound_sensor->times_triggered >= sound_sensor->times_to_trigger) {
				ESP_LOGI(TAG, "Sound detected %d times. Triggering alarm.",
						 sound_sensor->times_to_trigger);
				sound_sensor->times_triggered = 0;

				send_alert(sound_sensor->device_cfg->api_key, "sound_alert", NULL);
			}
		}

		if (sound_sensor->times_triggered > 0) {
			sound_sensor->reset_ticks_count++;

			if (sound_sensor->reset_ticks_count >= sound_sensor->required_reset_ticks) {
				ESP_LOGI(TAG, "Inactivity detected. Resetting sensor trigger.");
				sound_sensor->reset_ticks_count = 0;
				sound_sensor->times_triggered = 0;
			}
		}

		vTaskDelay(100 / portTICK_PERIOD_MS);
	}
}

esp_err_t init_sound_sensor(int gpio, bool is_digital, int treshold, int times_to_trigger,
							config_t* device_cfg, uint8_t monitor_i2c_addr) {
	ina219_dev_t current_monitor;

	esp_err_t err = init_current_monitor(&current_monitor, monitor_i2c_addr);
	if (err != ESP_OK) {
		ESP_LOGE(TAG, "Failed to initialize current monitor for sound sensor.");
		return err;
	}

	Sensor* sound_sensor =
		init_sensor(gpio, is_digital, treshold, times_to_trigger, 200, device_cfg, current_monitor);

	if (sound_sensor == NULL) {
		ESP_LOGE(TAG, "Failed to allocate memory for the sensor.");
		return ESP_ERR_NO_MEM;
	}

	// cppcheck-suppress constParameterCallback
	xTaskCreate(sound_sensor_event, "SOUND SENSOR", SOUND_SENSOR_STACK_SIZE, (void*)sound_sensor,
				SOUND_SENSOR_PRIORITY, NULL);

	ESP_LOGI(TAG, "Task for sound sensor created.");

	return ESP_OK;
}
