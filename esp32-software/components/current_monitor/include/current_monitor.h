#ifndef CURRENT_MONITOR_H
#define CURRENT_MONITOR_H

#include "esp_err.h"
#include "ina219.h"

typedef struct {
	int16_t bus_voltage_mv;
	int32_t shunt_voltage_uv;
	float current_ma;
	float power_mw;
} current_monitor_data;

/**
 * @brief Initializes the current monitoring system with an INA219 sensor
 *
 * This function initializes the INA219 current sensor with the specified I2C address.
 * The INA219 is used to monitor current consumption in the IoT emergency response system.
 *
 * @param[out] ina219_device Pointer to an INA219 device structure to be initialized
 * @param i2c_addr I2C address of the INA219 device
 *
 * @return
 *     - ESP_OK Success
 *     - ESP_ERR_INVALID_ARG Invalid arguments
 *     - ESP_FAIL Failed to initialize the device
 */
esp_err_t init_current_monitor(ina219_dev_t *ina219_device, uint8_t i2c_addr);

/**
 * @brief Reads current and power data from the INA219 current monitor
 *
 * This function reads the current, voltage, and power measurements from
 * the specified INA219 current monitor device and stores the results in
 * the provided data structure.
 *
 * @param dev Pointer to initialized INA219 device handle
 * @param[out] data Pointer to structure where the current monitor data will be stored
 *
 * @return
 *      - ESP_OK: Data read successfully
 *      - ESP_ERR_INVALID_ARG: Invalid arguments
 *      - ESP_FAIL: Failed to read data from device
 */
esp_err_t read_current_monitor_data(ina219_dev_t *dev, current_monitor_data *data);

#endif
