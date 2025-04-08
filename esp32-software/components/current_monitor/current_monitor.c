#include "current_monitor.h"

#include "driver/i2c.h"
#include "esp_err.h"
#include "esp_log.h"
#include "ina219.h"

/* INA219 Configuration */
#define INA219_SHUNT_OHMS 0.1f
#define INA219_MAX_EXPECTED_AMP 1.0f

const char* TAG = "current_monitor";

esp_err_t init_current_monitor(ina219_dev_t* ina219_device, uint8_t i2c_addr) {
	ina219_init_desc(ina219_device, I2C_NUM_0, i2c_addr, INA219_SHUNT_OHMS);

	uint16_t config = INA219_CONFIG_BVOLTAGERANGE_32V | INA219_CONFIG_GAIN_8_320MV |
					  INA219_CONFIG_BADCRES_12BIT | INA219_CONFIG_SADCRES_12BIT_1S |
					  INA219_CONFIG_MODE_CONTINUOUS;

	esp_err_t config_err = ina219_configure(ina219_device, config);
	if (config_err != ESP_OK) {
		ESP_LOGE(TAG, "Failed to configure INA219");
		return ESP_FAIL;
	}
	ESP_LOGI(TAG, "INA219 Configured");

	esp_err_t cal_err = ina219_calibrate(ina219_device, INA219_MAX_EXPECTED_AMP);
	if (cal_err != ESP_OK) {
		ESP_LOGE(TAG, "Failed to calibrate INA219");
		return ESP_FAIL;
	}
	ESP_LOGI(TAG, "INA219 Calibrated");

	return ESP_OK;
}

esp_err_t read_current_monitor_data(ina219_dev_t* dev, current_monitor_data* data) {
	if (dev == NULL || data == NULL) {
		ESP_LOGE(TAG, "Invalid argument: dev or data is NULL");
		return ESP_ERR_INVALID_ARG;
	}

	esp_err_t err = ina219_get_bus_voltage_mV(dev, &data->bus_voltage_mv);
	if (err != ESP_OK) {
		ESP_LOGE(TAG, "Failed to read bus voltage: %s", esp_err_to_name(err));
		data->bus_voltage_mv = 0;
		return err;
	}

	err = ina219_get_shunt_voltage_uV(dev, &data->shunt_voltage_uv);
	if (err != ESP_OK) {
		ESP_LOGE(TAG, "Failed to read shunt voltage: %s", esp_err_to_name(err));
		data->shunt_voltage_uv = 0;
		return err;
	}

	err = ina219_get_current_mA(dev, &data->current_ma);
	if (err != ESP_OK) {
		ESP_LOGE(TAG, "Failed to read current: %s", esp_err_to_name(err));
		data->current_ma = 0;
		return err;
	}

	err = ina219_get_power_mW(dev, &data->power_mw);
	if (err != ESP_OK) {
		ESP_LOGE(TAG, "Failed to read power: %s", esp_err_to_name(err));
		data->power_mw = 0;
		return err;
	}

	return ESP_OK;
}
