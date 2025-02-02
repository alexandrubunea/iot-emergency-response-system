#ifndef CONFIG_STORAGE_H
#define CONFIG_STORAGE_H

#include <stdbool.h>
#include <stdint.h>

#include "nvs_flash.h"
#include "nvs.h"

typedef enum {
    CONFIG_STATUS_OK = 0,
    CONFIG_STATUS_ERROR = -1
} config_status_t;

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
 * @brief Initialize NVS for configuration data.
 * 
 * @param handle NVS handle used to access the data.
 * @return `CONFIG_STATUS_OK` If the initialization was successful. \\
 * @return `CONFIG_STATUS_ERROR` If any error was triggered.
 */
config_status_t config_init(nvs_handle_t* handle);

/**
 * @brief Loads the configuration data from the NVS.
 * 
 * @param handle NVS handle used to access the data.
 * @param config Where configuration will be stored as a variable.
 * @return `CONFIG_STATUS_OK` If data was retrived from the NVS successfully. \\
 * @return `CONFIG_STATUS_ERROR` If any error was triggered.
 */
config_status_t config_load(nvs_handle_t handle, config_t* config);

/**
 * @brief Checks if there is any configuration data wrote on the NVS.
 * 
 * @param handle NVS handle used to access the data.
 * @return `true` If there is any configuration. \\
 * @return `false` If the configuration wasn't written yet on the NVS.
 */
bool is_configured(nvs_handle_t handle);

/**
 * @brief Free any allocated resource for storing in a configuration variable.
 * 
 * @param config Configuration to be freed.
 */
void config_close(config_t* config);

#endif