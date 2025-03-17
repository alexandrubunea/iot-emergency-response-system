#include "fire_sensor.h"

#include "esp_err.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "sensor.h"

const static char* TAG = "fire_sensor";

// cppcheck-suppress constParameterCallback
static void fire_sensor_event(void* pvParameters) {
	const Sensor* fire_sensor = (const Sensor*)pvParameters;

	while (true) {
		if (read_signal(fire_sensor) <= fire_sensor->treshold) {
			ESP_LOGI(TAG, "Fire detected");
		}

		vTaskDelay(500 / portTICK_PERIOD_MS);
	}
}

esp_err_t init_fire_sensor() {
	Sensor* fire_sensor = init_sensor(35, false, 3500);

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
