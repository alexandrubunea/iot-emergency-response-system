#ifndef CONFIG_SERVER_H
#define CONFIG_SERVER_H

#include <stdbool.h>
#include <stdint.h>

#include "config_storage.h"
#include "esp_http_server.h"

typedef enum {
	CONFIG_SERVER_STATUS_OK = 0,
	CONFIG_SERVER_STATUS_ERROR = -1
} config_server_status_t;

/**
 * @brief Initializes and starts an HTTP server for configuration management.
 *
 * This function starts an HTTP server and registers two URI handlers:
 * - `api/config`: Handles HTTP POST requests for configuration.
 * - `api/check`: Handles HTTP GET requests to check if the server is available.
 *
 * @param config Pointer to the configuration structure that will be used by the
 * server.
 *
 * @return The handle to the HTTP server if successful. \\
 * @return NULL on failure.
 *
 * @note The server must be properly stopped when no longer needed.
 * @warning If any handler registration fails, the function will return NULL.
 */
httpd_handle_t config_server_init(config_t* config);

/**
 * @brief Waits until the ESP32 device receives its configuration.
 *
 * This function repeatedly checks if the configuration has been received,
 * logging a message and waiting for a specified time between checks.
 *
 * @param seconds_between_checks The delay in seconds between each configuration
 * check.
 *
 * @note The function runs indefinitely until the configuration is received.
 * @warning This function should be used with caution in tasks to avoid blocking
 * execution unnecessarily.
 */
void wait_for_configuration(u_int8_t seconds_between_checks);

#endif