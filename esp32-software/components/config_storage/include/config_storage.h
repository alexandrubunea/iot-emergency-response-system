#ifndef CONFIG_STORAGE_H
#define CONFIG_STORAGE_H

#include <stdbool.h>
#include <stdint.h>

#include "nvs.h"
#include "nvs_flash.h"

typedef enum { CONFIG_STATUS_OK = 0, CONFIG_STATUS_ERROR = -1 } config_status_t;

typedef struct Config {
	char* api_key;
	char* ssid;
	char* password;

	bool motion;
	bool sound;
	bool gas;
	bool fire;
} config_t;

/**
 * @brief Initializes the Non-Volatile Storage (NVS) and opens the "config"
 * namespace.
 *
 * This function initializes the NVS storage and attempts to open the "config"
 * namespace. If the NVS partition is full or outdated, it erases and
 * reinitializes the storage up to 5 times.
 *
 * @param handle Pointer to an NVS handle where the opened namespace will be
 * stored.
 *
 * @return `CONFIG_STATUS_OK` if initialization is successful \\
 * @return `CONFIG_STATUS_ERROR` otherwise.
 *
 * @note If the function encounters repeated errors, it will erase and retry
 * initialization with a maximum of 5 attempts.
 *
 * @warning Erasing the NVS storage will delete all stored configuration data.
 */
config_status_t config_init(nvs_handle_t* handle);

/**
 * @brief Loads the stored configuration from NVS.
 *
 * Reads stored Wi-Fi credentials, API key, and sensor configurations from the
 * NVS storage.
 *
 * @param handle An open NVS handle for the "config" namespace.
 * @param config Pointer to a config_t structure where the loaded configuration
 * will be stored.
 *
 * @return `CONFIG_STATUS_OK` if all values are successfully loaded \\
 * @return `CONFIG_STATUS_ERROR` otherwise.
 *
 * @note The function assumes that `config` is already allocated before calling.
 */
config_status_t config_load(nvs_handle_t handle, config_t* config);

/**
 * @brief Saves the configuration settings to Non-Volatile Storage (NVS).
 *
 * This function stores the Wi-Fi credentials, API key, sensor settings, and a
 * configuration flag in the NVS storage. The changes are committed after
 * writing all values.
 *
 * @param handle An open NVS handle for the "config" namespace.
 * @param config Pointer to a config_t structure containing the settings to be
 * saved.
 *
 * @return `CONFIG_STATUS_OK` if the configuration is successfully saved \\
 * @return `CONFIG_STATUS_ERROR` otherwise.
 *
 * @note The function commits the changes to NVS after setting all values.
 * @warning If an error occurs, some settings might be partially saved in NVS.
 */
config_status_t config_save(nvs_handle_t handle, config_t* config);

/**
 * @brief Checks whether the device has been configured.
 *
 * Reads the "configured" flag from NVS storage to determine if a valid
 * configuration exists.
 *
 * @param handle An open NVS handle for the "config" namespace.
 *
 * @return `true` if the device has been configured \\
 * @return `false` otherwise.
 */
bool is_configured(nvs_handle_t handle);

/**
 * @brief Frees dynamically allocated memory inside the config_t structure.
 *
 * This function releases memory allocated for strings in the config structure
 * and resets pointers to `NULL` to prevent dangling references.
 *
 * @param config Pointer to the config_t structure to be cleaned up.
 *
 * @note After calling this function, the `config` structure should not be
 * accessed.
 */
void config_close(config_t** config);

#endif
