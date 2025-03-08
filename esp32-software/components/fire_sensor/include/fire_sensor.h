#ifndef FIRE_SENSOR_H
#define FIRE_SENSOR_H

#include "esp_err.h"

#define FIRE_SENSOR_STACK_SIZE 2048
#define FIRE_SENSOR_PRIORITY 5

/**
 * @brief Initializes and starts the fire sensor task.
 *
 * Creates a sensor instance and starts a FreeRTOS task to handle sound detection.
 *
 * @return ESP_OK on success, ESP_ERR_NO_MEM if memory allocation fails.
 */
esp_err_t init_fire_sensor();

#endif
