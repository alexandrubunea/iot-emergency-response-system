#include "fire_sensor.h"

#include "esp_err.h"
#include "esp_http_client.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "sensor.h"
#include "utils.h"

const static char* TAG = "fire_sensor";

// cppcheck-suppress constParameterCallback
static void fire_sensor_event(void* pvParameters) {
	Sensor* fire_sensor = (Sensor*)pvParameters;

	while (fire_sensor->device_cfg->fire) {
		int value = read_signal(fire_sensor);

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

		vTaskDelay(521 / portTICK_PERIOD_MS);
	}
}

esp_err_t init_fire_sensor(int gpio, bool is_digital, int treshold, int times_to_trigger,
						   config_t* device_cfg) {
	Sensor* fire_sensor = init_sensor(gpio, is_digital, treshold, times_to_trigger, device_cfg);

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
