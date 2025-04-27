#ifndef SENSOR_H
#define SENSOR_H

#include <stdbool.h>
#include <stdint.h>

#include "config_storage.h"
#include "driver/gpio.h"
#include "esp_adc/adc_oneshot.h"
#include "ina219.h"

typedef struct sensor {
	gpio_num_t gpio;
	bool is_digital;
	int treshold;
	int times_triggered;
	int times_to_trigger;
	int required_reset_ticks;
	int reset_ticks_count;

	config_t* device_cfg;

	ina219_dev_t current_monitor;

	adc_channel_t adc_channel;

	TickType_t start_tick;
	bool is_warmed_up;
} Sensor;

/**
 * @brief Initializes a sensor instance.
 *
 * Allocates and configures a Sensor structure based on the provided parameters.
 *
 * @param gpio GPIO pin number associated with the sensor.
 * @param is_digital Boolean flag indicating whether the sensor is digital or analog.
 * @param treshold Threshold value for analog sensor (unused for digital sensors).
 * @param times_to_trigger Number of times the sensor must trigger before the signal is considered
 * valid.
 * @param required_reset_ticks Number of ticks required to reset the sensor trigger.
 * @param device_cfg Pointer to the device configuration structure.
 * @param current_monitor INA219 device handle for current monitoring.
 * @return Pointer to the initialized Sensor structure, or NULL on failure.
 */
Sensor* init_sensor(gpio_num_t gpio, bool is_digital, int treshold, int times_to_trigger,
					int required_reset_ticks, config_t* device_cfg, ina219_dev_t current_monitor);

/**
 * @brief Reads the signal from the sensor.
 *
 * Reads a digital or analog value depending on the sensor type.
 *
 * @param sensor Pointer to the Sensor structure.
 * @return The sensor signal value, or -1 on error.
 */
int read_signal(const Sensor* sensor);

/**
 * @brief Deletes a sensor instance and frees associated resources.
 *
 * This function releases the allocated memory and, for analog sensors, deletes the ADC unit.
 *
 * @param sensor Pointer to a pointer of a Sensor structure to be deleted.
 */
void delete_sensor(Sensor** sensor);

#endif
