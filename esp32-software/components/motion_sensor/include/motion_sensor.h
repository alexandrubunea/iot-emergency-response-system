#ifndef MOTION_SENSOR_H
#define MOTION_SENSOR_H

#include "esp_err.h"

#define MOTION_SENSOR_STACK_SIZE 2048
#define MOTION_SENSOR_PRIORITY 5

/**
 * @brief Initializes and starts the motion sensor task.
 *
 * Creates a sensor instance and starts a FreeRTOS task to handle motion detection.
 *
 * @return ESP_OK on success, ESP_ERR_NO_MEM if memory allocation fails.
 */
esp_err_t init_motion_sensor();

#endif
