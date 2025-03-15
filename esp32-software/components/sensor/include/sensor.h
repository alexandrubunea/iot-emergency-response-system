#ifndef SENSOR_H
#define SENSOR_H

#include <stdbool.h>
#include <stdint.h>

#include "driver/gpio.h"
#include "esp_adc/adc_oneshot.h"

typedef struct sensor {
	gpio_num_t gpio;
	bool is_digital;
	int treshold;

	adc_channel_t adc_channel;
} Sensor;

/**
 * @brief Initializes a sensor instance.
 *
 * Allocates and configures a Sensor structure based on the provided parameters.
 *
 * @param gpio GPIO pin number associated with the sensor.
 * @param is_digital Boolean flag indicating whether the sensor is digital or analog.
 * @param treshold Threshold value for analog sensor (unused for digital sensors).
 * @return Pointer to the initialized Sensor structure, or NULL on failure.
 */
Sensor* init_sensor(gpio_num_t gpio, bool is_digital, int treshold);

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
