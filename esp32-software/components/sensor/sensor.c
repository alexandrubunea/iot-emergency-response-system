#include "sensor.h"

#include <stdbool.h>
#include <stdint.h>
#include <stdlib.h>

#include "driver/gpio.h"
#include "esp_adc/adc_oneshot.h"
#include "esp_log.h"
#include "ina219.h"

static const char* TAG = "sensor";

static adc_oneshot_unit_handle_t adc_handle = NULL;

static esp_err_t init_analog(Sensor** sensor) {
	if (sensor == NULL || *sensor == NULL) {
		ESP_LOGE(TAG, "Sensor pointer is NULL.");
		return ESP_FAIL;
	}

	adc_unit_t unit = ADC_UNIT_1;
	adc_oneshot_unit_init_cfg_t init_config = {
		.unit_id = unit,
		.ulp_mode = ADC_ULP_MODE_DISABLE,
	};

	if (adc_handle == NULL) {
		if (adc_oneshot_new_unit(&init_config, &adc_handle) != ESP_OK) {
			ESP_LOGE(TAG, "Failed to initialize ADC oneshot unit.");
			return ESP_FAIL;
		}
	}

	adc_oneshot_chan_cfg_t config = {
		.bitwidth = ADC_BITWIDTH_DEFAULT,
		.atten = ADC_ATTEN_DB_12,
	};

	adc_channel_t channel;
	if (adc_oneshot_io_to_channel((*sensor)->gpio, &unit, &channel) != ESP_OK) {
		ESP_LOGE(TAG, "Failed to convert GPIO %d to ADC channel.", (*sensor)->gpio);
		return ESP_FAIL;
	}

	if (adc_oneshot_config_channel(adc_handle, channel, &config) != ESP_OK) {
		ESP_LOGE(TAG, "Failed to configure ADC channel for GPIO %d.", (*sensor)->gpio);
		return ESP_FAIL;
	}

	(*sensor)->adc_channel = channel;

	return ESP_OK;
}

Sensor* init_sensor(gpio_num_t gpio, bool is_digital, int treshold, int times_to_trigger,
					int required_reset_ticks, config_t* device_cfg, ina219_dev_t current_monitor) {
	Sensor* sensor = (Sensor*)malloc(sizeof(Sensor));

	if (sensor == NULL) return NULL;

	sensor->gpio = gpio;
	sensor->is_digital = is_digital;
	sensor->treshold = treshold;
	sensor->times_triggered = 0;
	sensor->times_to_trigger = times_to_trigger;
	sensor->device_cfg = device_cfg;
	sensor->required_reset_ticks = required_reset_ticks;
	sensor->reset_ticks_count = 0;
	sensor->current_monitor = current_monitor;
	sensor->start_tick = 0;
	sensor->is_warmed_up = false;

	if (is_digital && gpio_set_direction(sensor->gpio, GPIO_MODE_INPUT) != ESP_OK) {
		ESP_LOGE(TAG, "Failed to set GPIO direction.");
		free(sensor);
		return NULL;
	} else if (!is_digital && init_analog(&sensor) != ESP_OK) {
		free(sensor);
		return NULL;
	}

	return sensor;
}

int read_signal(const Sensor* sensor) {
	if (sensor->is_digital) return gpio_get_level(sensor->gpio);

	int signal_value;

	if (adc_oneshot_read(adc_handle, sensor->adc_channel, &signal_value) != ESP_OK) {
		ESP_LOGE(TAG, "Error occurred while trying to read analog data.");
		return -1;
	}

	return signal_value;
}

void delete_sensor(Sensor** sensor) {
	if (sensor == NULL || *sensor == NULL) return;

	if (!(*sensor)->is_digital && adc_oneshot_del_unit(adc_handle) != ESP_OK) {
		ESP_LOGE(TAG, "Error occurred while trying to delete ADC oneshot unit.");
	}

	free(*sensor);
	*sensor = NULL;
}
