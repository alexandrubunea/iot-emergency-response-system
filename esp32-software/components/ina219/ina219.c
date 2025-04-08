#include "ina219.h"

#include "driver/i2c.h"
#include "esp_log.h"

#define I2C_TIMEOUT_MS 100
#define INA219_SHUNT_LSB_UV 10
#define INA219_BUS_VOLTAGE_LSB_MV 4

static const char *TAG = "current_monitor";

static esp_err_t ina219_write_register(ina219_dev_t *dev, uint8_t reg_addr, uint16_t value) {
	uint8_t buffer[3];
	buffer[0] = reg_addr;
	buffer[1] = (value >> 8) & 0xFF;
	buffer[2] = value & 0xFF;

	esp_err_t err = i2c_master_write_to_device(dev->i2c_port, dev->dev_addr, buffer, sizeof(buffer),
											   pdMS_TO_TICKS(I2C_TIMEOUT_MS));
	if (err != ESP_OK) {
		ESP_LOGE(TAG, "I2C Write Reg 0x%02X failed: %s", reg_addr, esp_err_to_name(err));
	}
	return err;
}

static esp_err_t ina219_read_register(ina219_dev_t *dev, uint8_t reg_addr, uint16_t *value) {
	uint8_t write_buf = reg_addr;
	uint8_t read_buf[2];

	esp_err_t err = i2c_master_write_read_device(dev->i2c_port, dev->dev_addr, &write_buf, 1,
												 read_buf, 2, pdMS_TO_TICKS(I2C_TIMEOUT_MS));
	if (err != ESP_OK) {
		ESP_LOGE(TAG, "I2C Read Reg 0x%02X failed: %s", reg_addr, esp_err_to_name(err));
		*value = 0;
		return err;
	}

	*value = ((uint16_t)read_buf[0] << 8) | read_buf[1];
	return ESP_OK;
}

void ina219_init_desc(ina219_dev_t *dev, i2c_port_t i2c_num, uint8_t dev_addr,
					  float shunt_resistance) {
	if (dev == NULL) {
		ESP_LOGE(TAG, "Device descriptor cannot be NULL");
		return;
	}
	dev->i2c_port = i2c_num;
	dev->dev_addr = dev_addr;
	dev->shunt_resistance_ohm = shunt_resistance;
	dev->calibration_value = 0;
	dev->current_lsb_mA = 0;
	dev->power_lsb_mW = 0;
	ESP_LOGI(TAG, "Device descriptor initialized: Port=%d, Addr=0x%02X, Rshunt=%.3f Ohm", i2c_num,
			 dev_addr, shunt_resistance);
}

esp_err_t ina219_configure(ina219_dev_t *dev, uint16_t config) {
	if (dev == NULL) return ESP_ERR_INVALID_ARG;
	esp_err_t err = ina219_write_register(dev, INA219_REG_CONFIG, config);
	if (err == ESP_OK) {
		ESP_LOGI(TAG, "Configured with value 0x%04X", config);
	}
	vTaskDelay(pdMS_TO_TICKS(1));
	return err;
}

esp_err_t ina219_calibrate(ina219_dev_t *dev, float max_expected_current_A) {
	if (dev == NULL) return ESP_ERR_INVALID_ARG;
	if (dev->shunt_resistance_ohm <= 0) {
		ESP_LOGE(TAG, "Shunt resistance must be positive and set in descriptor.");
		return ESP_ERR_INVALID_STATE;
	}

	float current_lsb_A = max_expected_current_A / 32768.0f;

	uint16_t calibration = (uint16_t)(0.04096f / (current_lsb_A * dev->shunt_resistance_ohm));

	float power_lsb_W = 20.0f * current_lsb_A;

	dev->calibration_value = calibration;
	dev->current_lsb_mA = current_lsb_A * 1000.0f;
	dev->power_lsb_mW = power_lsb_W * 1000.0f;

	ESP_LOGI(TAG, "Calibration calculated: MaxCurrent=%.2f A, Rshunt=%.3f Ohm",
			 max_expected_current_A, dev->shunt_resistance_ohm);
	ESP_LOGI(TAG, "  -> Current LSB: %.6f mA", dev->current_lsb_mA);
	ESP_LOGI(TAG, "  -> Power LSB:   %.6f mW", dev->power_lsb_mW);
	ESP_LOGI(TAG, "  -> Cal Value:   %u (0x%04X)", dev->calibration_value, dev->calibration_value);

	esp_err_t err = ina219_write_register(dev, INA219_REG_CALIBRATION, dev->calibration_value);

	if (err == ESP_OK) {
		ESP_LOGI(TAG, "Calibration value written successfully.");
	} else {
		ESP_LOGE(TAG, "Failed to write calibration register.");
		dev->calibration_value = 0;
		dev->current_lsb_mA = 0;
		dev->power_lsb_mW = 0;
	}
	vTaskDelay(pdMS_TO_TICKS(1));
	return err;
}

esp_err_t ina219_get_bus_voltage_mV(ina219_dev_t *dev, int16_t *voltage_mV) {
	if (dev == NULL || voltage_mV == NULL) return ESP_ERR_INVALID_ARG;

	uint16_t raw_voltage;
	esp_err_t err = ina219_read_register(dev, INA219_REG_BUSVOLTAGE, &raw_voltage);
	if (err != ESP_OK) {
		*voltage_mV = 0;
		return err;
	}

	if (!(raw_voltage & 0x0002)) {
		ESP_LOGW(TAG, "Bus voltage conversion not ready");
		*voltage_mV = 0;
		return ESP_ERR_INVALID_STATE;
	}

	if (raw_voltage & 0x0001) {
		ESP_LOGW(TAG, "Bus voltage overflow detected");
		*voltage_mV = 0;
		return ESP_ERR_NO_MEM;
	}

	raw_voltage = raw_voltage >> 3;
	*voltage_mV = (int16_t)(raw_voltage * INA219_BUS_VOLTAGE_LSB_MV);

	return ESP_OK;
}

esp_err_t ina219_get_shunt_voltage_uV(ina219_dev_t *dev, int32_t *voltage_uV) {
	if (dev == NULL || voltage_uV == NULL) return ESP_ERR_INVALID_ARG;

	uint16_t raw_voltage_u16;
	esp_err_t err = ina219_read_register(dev, INA219_REG_SHUNTVOLTAGE, &raw_voltage_u16);
	if (err != ESP_OK) {
		*voltage_uV = 0;
		return err;
	}

	int16_t raw_voltage_s16 = (int16_t)raw_voltage_u16;

	*voltage_uV = (int32_t)raw_voltage_s16 * INA219_SHUNT_LSB_UV;

	return ESP_OK;
}

esp_err_t ina219_get_current_mA(ina219_dev_t *dev, float *current_mA) {
	if (dev == NULL || current_mA == NULL) return ESP_ERR_INVALID_ARG;
	if (dev->calibration_value == 0 || dev->current_lsb_mA == 0) {
		ESP_LOGE(TAG, "Device not calibrated. Call ina219_calibrate() first.");
		*current_mA = 0.0f;
		return ESP_ERR_INVALID_STATE;
	}

	uint16_t raw_current_u16;
	esp_err_t err = ina219_read_register(dev, INA219_REG_CURRENT, &raw_current_u16);
	if (err != ESP_OK) {
		*current_mA = 0.0f;
		return err;
	}

	int16_t raw_current_s16 = (int16_t)raw_current_u16;
	*current_mA = (float)raw_current_s16 * dev->current_lsb_mA;

	return ESP_OK;
}

esp_err_t ina219_get_power_mW(ina219_dev_t *dev, float *power_mW) {
	if (dev == NULL || power_mW == NULL) return ESP_ERR_INVALID_ARG;
	if (dev->calibration_value == 0 || dev->power_lsb_mW == 0) {
		ESP_LOGE(TAG, "Device not calibrated. Call ina219_calibrate() first.");
		*power_mW = 0.0f;
		return ESP_ERR_INVALID_STATE;
	}

	uint16_t raw_power;
	esp_err_t err = ina219_read_register(dev, INA219_REG_POWER, &raw_power);
	if (err != ESP_OK) {
		*power_mW = 0.0f;
		return err;
	}

	*power_mW = (float)raw_power * dev->power_lsb_mW;

	return ESP_OK;
}
