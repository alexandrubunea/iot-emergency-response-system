#ifndef SOUND_SENSOR_H
#define SOUND_SENSOR_H

#include <stdbool.h>

#include "config_storage.h"
#include "esp_err.h"

#define SOUND_SENSOR_STACK_SIZE 2048
#define SOUND_SENSOR_PRIORITY 5

/**
 * @brief Initializes and starts the sound sensor task.
 *
 * Creates a sensor instance and starts a FreeRTOS task to handle sound detection.
 *
 * @param gpio GPIO pin number associated with the sound sensor.
 * @param is_digital Boolean flag indicating whether the sensor is digital or analog.
 * @param treshold Threshold value for analog sensor (unused for digital sensors).
 * @param times_to_trigger Number of times the sensor must trigger before the signal is considered
 * valid.
 * @param device_cfg Pointer to the device configuration structure.
 *
 * @return ESP_OK on success, ESP_ERR_NO_MEM if memory allocation fails.
 */
esp_err_t init_sound_sensor(int gpio, bool is_digital, int treshold, int times_to_trigger,
							config_t* device_cfg);

#endif
