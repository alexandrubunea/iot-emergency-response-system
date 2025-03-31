#include "motion_sensor.h"

#include "esp_err.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
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

		vTaskDelay(500 / portTICK_PERIOD_MS);
	}
}

esp_err_t init_motion_sensor(int gpio, bool is_digital, int treshold, int times_to_trigger,
							 config_t* device_cfg) {
	Sensor* motion_sensor = init_sensor(gpio, is_digital, treshold, times_to_trigger, device_cfg);

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
