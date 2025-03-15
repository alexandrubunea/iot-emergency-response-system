#include "gas_sensor.h"

#include "esp_err.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "sensor.h"

const static char* TAG = "gas_sensor";

// cppcheck-suppress constParameterCallback
static void gas_sensor_event(void* pvParameters) {
	const Sensor* gas_sensor = (const Sensor*)pvParameters;

	while (true) {
		if (read_signal(gas_sensor) >= gas_sensor->treshold) {
			ESP_LOGI(TAG, "Gas detected");
		}

		vTaskDelay(2000 / portTICK_PERIOD_MS);
	}
}

esp_err_t init_gas_sensor() {
	Sensor* gas_sensor = init_sensor(34, false, 100);

	if (gas_sensor == NULL) {
		ESP_LOGE(TAG, "Failed to allocate memory for the sensor.");
		return ESP_ERR_NO_MEM;
	}

	// cppcheck-suppress constParameterCallback
	xTaskCreate(gas_sensor_event, "GAS SENSOR", GAS_SENSOR_STACK_SIZE, (void*)gas_sensor,
				GAS_SENSOR_PRIORITY, NULL);

	ESP_LOGI(TAG, "Task for gas sensor created.");

	return ESP_OK;
}
