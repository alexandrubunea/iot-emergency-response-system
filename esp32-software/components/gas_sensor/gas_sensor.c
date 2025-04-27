#include "gas_sensor.h"

#include "current_monitor.h"
#include "esp_err.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "ina219.h"
#include "sensor.h"
#include "utils.h"

#define GAS_SENSOR_WARMUP_MINUTES 15
#define GAS_SENSOR_WARMUP_MS (GAS_SENSOR_WARMUP_MINUTES * 60 * 1000)

const TickType_t WARMUP_DELAY_TICKS = pdMS_TO_TICKS(GAS_SENSOR_WARMUP_MS);

const static char* TAG = "gas_sensor";

// cppcheck-suppress constParameterCallback
static void gas_sensor_event(void* pvParameters) {
	Sensor* gas_sensor = (Sensor*)pvParameters;

	while (true) {
		if (!gas_sensor->is_warmed_up) {
			TickType_t current_tick = xTaskGetTickCount();
			if ((current_tick - gas_sensor->start_tick) >= WARMUP_DELAY_TICKS) {
				gas_sensor->is_warmed_up = true;
				ESP_LOGI(TAG, "Gas sensor warm-up complete. Monitoring enabled.");

				send_log(gas_sensor->device_cfg->api_key, "gas_sensor",
						 "Gas sensor warm-up complete.");
			} else {
				ESP_LOGD(TAG, "Gas sensor warming up... (%lu / %lu ticks)",
						 (unsigned long)(current_tick - gas_sensor->start_tick),
						 (unsigned long)WARMUP_DELAY_TICKS);
				vTaskDelay(pdMS_TO_TICKS(5000));
				continue;
			}
		}

		int value = read_signal(gas_sensor);
		current_monitor_data current_data;
		esp_err_t err = read_current_monitor_data(&gas_sensor->current_monitor, &current_data);

		if (current_data.power_mw < 790.00) {
			ESP_LOGI(TAG, "Power consumption is too low. Sensor might be malfunctioning.");
			send_malfunction(gas_sensor->device_cfg->api_key, "gas_sensor",
							 "Power consumption is too low. Sensor might be malfunctioning.");

			vTaskDelay(5000 / portTICK_PERIOD_MS);

			continue;
		}

		if (current_data.current_ma < 140.00) {
			ESP_LOGI(TAG, "Current consumption is too low. Sensor might be malfunctioning.");
			send_malfunction(gas_sensor->device_cfg->api_key, "gas_sensor",
							 "Current consumption is too low. Sensor might be malfunctioning.");

			vTaskDelay(5000 / portTICK_PERIOD_MS);

			continue;
		}

		if (err != ESP_OK) {
			ESP_LOGE(TAG, "Failed to read current monitor data: %s", esp_err_to_name(err));
			vTaskDelay(pdMS_TO_TICKS(1000));
			continue;
		}

		if (value != -1 && value >= gas_sensor->treshold) {
			gas_sensor->times_triggered++;
			ESP_LOGI(TAG, "Gas detected. Times triggered: %d", gas_sensor->times_triggered);

			if (gas_sensor->times_triggered >= gas_sensor->times_to_trigger) {
				ESP_LOGI(TAG, "Gas detected %d times. Triggering alarm.",
						 gas_sensor->times_to_trigger);
				gas_sensor->times_triggered = 0;

				send_alert(gas_sensor->device_cfg->api_key, "gas_alert", NULL);
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

		vTaskDelay(pdMS_TO_TICKS(500));
	}
}

esp_err_t init_gas_sensor(int gpio, bool is_digital, int treshold, int times_to_trigger,
						  config_t* device_cfg, uint8_t monitor_i2c_addr) {
	ina219_dev_t current_monitor;

	esp_err_t err = init_current_monitor(&current_monitor, monitor_i2c_addr);
	if (err != ESP_OK) {
		ESP_LOGE(TAG, "Failed to initialize current monitor for gas sensor.");
		return err;
	}

	Sensor* gas_sensor =
		init_sensor(gpio, is_digital, treshold, times_to_trigger, 5, device_cfg, current_monitor);

	if (gas_sensor == NULL) {
		ESP_LOGE(TAG, "Failed to allocate memory for the sensor.");
		return ESP_ERR_NO_MEM;
	}

	gas_sensor->start_tick = xTaskGetTickCount();
	ESP_LOGI(TAG, "Gas sensor initialized. Warm-up period started (%d minutes).",
			 (int)GAS_SENSOR_WARMUP_MINUTES);

	// cppcheck-suppress constParameterCallback
	xTaskCreate(gas_sensor_event, "GAS SENSOR", GAS_SENSOR_STACK_SIZE, (void*)gas_sensor,
				GAS_SENSOR_PRIORITY, NULL);

	ESP_LOGI(TAG, "Task for gas sensor created.");

	return ESP_OK;
}
