#ifndef INA_219_H
#define INA_219_H

#include "driver/i2c.h"
#include "esp_err.h"

#define INA219_DEFAULT_ADDRESS 0x40

#define INA219_REG_CONFIG 0x00
#define INA219_REG_SHUNTVOLTAGE 0x01
#define INA219_REG_BUSVOLTAGE 0x02
#define INA219_REG_POWER 0x03
#define INA219_REG_CURRENT 0x04
#define INA219_REG_CALIBRATION 0x05

#define INA219_CONFIG_BVOLTAGERANGE_16V 0x0000
#define INA219_CONFIG_BVOLTAGERANGE_32V 0x2000

#define INA219_CONFIG_GAIN_1_40MV 0x0000
#define INA219_CONFIG_GAIN_2_80MV 0x0800
#define INA219_CONFIG_GAIN_4_160MV 0x1000
#define INA219_CONFIG_GAIN_8_320MV 0x1800

#define INA219_CONFIG_BADCRES_12BIT 0x0180

#define INA219_CONFIG_SADCRES_12BIT_1S 0x0018

#define INA219_CONFIG_MODE_CONTINUOUS 0x0007

typedef struct {
	i2c_port_t i2c_port;
	uint8_t dev_addr;
	uint16_t calibration_value;
	float current_lsb_mA;
	float power_lsb_mW;
	float shunt_resistance_ohm;
} ina219_dev_t;

/**
 * @brief Initialize INA219 device structure (doesn't talk to device yet)
 *
 * @param dev Pointer to INA219 device structure.
 * @param i2c_num I2C port number.
 * @param dev_addr I2C address of the INA219.
 * @param shunt_resistance Value of the shunt resistor in Ohms.
 */
void ina219_init_desc(ina219_dev_t *dev, i2c_port_t i2c_num, uint8_t dev_addr,
					  float shunt_resistance);

/**
 * @brief Configure the INA219 sensor
 *
 * @param dev Pointer to initialized INA219 device structure.
 * @param config Configuration value (combine flags like INA219_CONFIG_BVOLTAGERANGE_32V |
 * INA219_CONFIG_GAIN_8_320MV | ...)
 * @return ESP_OK on success, ESP_FAIL or other error codes on failure.
 */
esp_err_t ina219_configure(ina219_dev_t *dev, uint16_t config);

/**
 * @brief Calibrate the INA219 based on max expected current and shunt resistance
 *
 * @param dev Pointer to initialized INA219 device structure.
 * @param max_expected_current_A Maximum current you expect to measure (e.g., 1.0 for 1A).
 * @return ESP_OK on success, ESP_FAIL or other error codes on failure.
 */
esp_err_t ina219_calibrate(ina219_dev_t *dev, float max_expected_current_A);

/**
 * @brief Read Bus Voltage
 *
 * @param dev Pointer to initialized INA219 device structure.
 * @param[out] voltage_mV Pointer to store the bus voltage in millivolts.
 * @return ESP_OK on success, ESP_FAIL or other error codes on failure.
 */
esp_err_t ina219_get_bus_voltage_mV(ina219_dev_t *dev, int16_t *voltage_mV);

/**
 * @brief Read Shunt Voltage
 *
 * @param dev Pointer to initialized INA219 device structure.
 * @param[out] voltage_uV Pointer to store the shunt voltage in microvolts.
 * @return ESP_OK on success, ESP_FAIL or other error codes on failure.
 */
esp_err_t ina219_get_shunt_voltage_uV(ina219_dev_t *dev, int32_t *voltage_uV);

/**
 * @brief Read Current (requires calibration first)
 *
 * @param dev Pointer to initialized INA219 device structure.
 * @param[out] current_mA Pointer to store the current in milliamps.
 * @return ESP_OK on success, ESP_FAIL or other error codes on failure.
 */
esp_err_t ina219_get_current_mA(ina219_dev_t *dev, float *current_mA);

/**
 * @brief Read Power (requires calibration first)
 *
 * @param dev Pointer to initialized INA219 device structure.
 * @param[out] power_mW Pointer to store the power in milliwatts.
 * @return ESP_OK on success, ESP_FAIL or other error codes on failure.
 */
esp_err_t ina219_get_power_mW(ina219_dev_t *dev, float *power_mW);

#endif
