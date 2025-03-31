#include "gas_sensor.h"

#include "esp_err.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "sensor.h"
#include "utils.h"

const static char* TAG = "gas_sensor";

// cppcheck-suppress constParameterCallback
static void gas_sensor_event(void* pvParameters) {
	Sensor* gas_sensor = (Sensor*)pvParameters;

	while (true) {
		int value = read_signal(gas_sensor);

		if (value != -1 && value >= gas_sensor->treshold) {
			gas_sensor->times_triggered++;
			ESP_LOGI(TAG, "Gas detected. Times triggered: %d", gas_sensor->times_triggered);

			if (gas_sensor->times_triggered >= gas_sensor->times_to_trigger) {
				ESP_LOGI(TAG, "Gas detected %d times. Triggering alarm.",
						 gas_sensor->times_to_trigger);
				gas_sensor->times_triggered = 0;

				send_alert(gas_sensor->device_cfg->api_key, "gas alert", NULL);
			}
		}

		if (gas_sensor->times_triggered > 0) {
			gas_sensor->reset_ticks_count++;

			if (gas_sensor->reset_ticks_count >= gas_sensor->required_reset_ticks) {
				ESP_LOGI(TAG, "Inactivity detected. Resetting sensor trigger.");
				gas_sensor->reset_ticks_count = 0;
				gas_sensor->times_triggered = 0;
			}
		}

		vTaskDelay(2017 / portTICK_PERIOD_MS);
	}
}

esp_err_t init_gas_sensor(int gpio, bool is_digital, int treshold, int times_to_trigger,
						  config_t* device_cfg) {
	Sensor* gas_sensor = init_sensor(gpio, is_digital, treshold, times_to_trigger, 5, device_cfg);

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
