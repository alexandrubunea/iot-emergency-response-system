#include "sound_sensor.h"

#include "esp_err.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "sensor.h"

const static char* TAG = "sound_sensor";

// cppcheck-suppress constParameterCallback
static void sound_sensor_event(void* pvParameters) {
	const Sensor* sound_sensor = (const Sensor*)pvParameters;

	while (true) {
		if (read_signal(sound_sensor)) {
			ESP_LOGI(TAG, "Sound detected");
		}

		vTaskDelay(50 / portTICK_PERIOD_MS);
	}
}

esp_err_t init_sound_sensor() {
	Sensor* sound_sensor = init_sensor(27, true, -1);

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
