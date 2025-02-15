#include "motion_sensor.h"

#include "esp_err.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "sensor.h"

const static char* TAG = "motion_sensor";

// cppcheck-suppress constParameterCallback
static void motion_sensor_event(void* pvParameters) {
	const Sensor* motion_sensor = (const Sensor*)pvParameters;

	while (true) {
		if (read_signal(motion_sensor)) {
			ESP_LOGI(TAG, "Motion detected.");
		}

		vTaskDelay(500 / portTICK_PERIOD_MS);
	}
}

esp_err_t init_motion_sensor() {
	Sensor* motion_sensor = init_sensor(13, true, -1);

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
