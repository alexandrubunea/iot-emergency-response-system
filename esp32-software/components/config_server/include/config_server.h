#ifndef CONFIG_SERVER_H
#define CONFIG_SERVER_H

#include <stdbool.h>
#include <stdint.h>

#include "esp_http_server.h"

#include "config_storage.h"

typedef enum {
    CONFIG_SERVER_STATUS_OK = 0,
    CONFIG_SERVER_STATUS_ERROR = -1
} config_server_status_t;

httpd_handle_t config_server_init(config_t* device_configuratio);
void wait_for_configuration(u_int8_t seconds_between_checks);

#endif