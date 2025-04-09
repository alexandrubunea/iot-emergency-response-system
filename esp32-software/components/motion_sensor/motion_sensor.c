#include "motion_sensor.h"

#include "current_monitor.h"
#include "esp_err.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "ina219.h"
#include "sensor.h"
#include "utils.h"

const static char* TAG = "motion_sensor";

// cppcheck-suppress constParameterCallback
static void motion_sensor_event(void* pvParameters) {
	Sensor* motion_sensor = (Sensor*)pvParameters;

	while (true) {
		if (read_signal(motion_sensor)) {
			motion_sensor->times_triggered++;
			ESP_LOGI(TAG, "Motion detected. Times triggered: %d", motion_sensor->times_triggered);

			if (motion_sensor->times_triggered >= motion_sensor->times_to_trigger) {
				ESP_LOGI(TAG, "Motion detected %d times. Triggering alarm.",
						 motion_sensor->times_to_trigger);
				motion_sensor->times_triggered = 0;

				send_alert(motion_sensor->device_cfg->api_key, "motion_alert", "");
			}
		}

		if (motion_sensor->times_triggered > 0) {
			motion_sensor->reset_ticks_count++;

			if (motion_sensor->reset_ticks_count >= motion_sensor->required_reset_ticks) {
				ESP_LOGI(TAG, "Inactivity detected. Resetting sensor trigger.");

				motion_sensor->reset_ticks_count = 0;
				motion_sensor->times_triggered = 0;
			}
		}

		vTaskDelay(500 / portTICK_PERIOD_MS);
	}
}

esp_err_t init_motion_sensor(int gpio, bool is_digital, int treshold, int times_to_trigger,
							 config_t* device_cfg, uint8_t monitor_i2c_addr) {
	ina219_dev_t current_monitor;

	esp_err_t err = init_current_monitor(&current_monitor, monitor_i2c_addr);
	if (err != ESP_OK) {
		ESP_LOGE(TAG, "Failed to initialize current monitor for gas sensor.");
		return err;
	}

	Sensor* motion_sensor =
		init_sensor(gpio, is_digital, treshold, times_to_trigger, 100, device_cfg, current_monitor);

	if (motion_sensor == NULL) {
		ESP_LOGE(TAG, "Failed to allocate memory for the sensor.");
		return ESP_ERR_NO_MEM;
	}

	// cppcheck-suppress constParameterCallback
	xTaskCreate(motion_sensor_event, "MOTION SENSOR", MOTION_SENSOR_STACK_SIZE,
				(void*)motion_sensor, MOTION_SENSOR_PRIORITY, NULL);

	ESP_LOGI(TAG, "Task for motion sensor created.");

	return ESP_OK;
}
