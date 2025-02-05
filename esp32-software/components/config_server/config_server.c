#include "config_server.h"

#include <stdio.h>
#include <stdbool.h>
#include <stdint.h>
#include <string.h>

#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

#include "esp_log.h"

#include "esp_http_server.h"
#include "cJSON.h"

#include "config_storage.h"

static const char *TAG = "config_server";

static bool esp32_config_received = false;
static httpd_handle_t handle = NULL;


static esp_err_t check_handler(httpd_req_t* req) {

    const char* res = "{\"status\": \"sucesss\"}";

    httpd_resp_set_status(req, "200 OK");
    httpd_resp_set_type(req, "application/json");
    httpd_resp_send(req, res, strlen(res));

    return ESP_OK;
}

static esp_err_t config_handler(httpd_req_t* req) {
    config_t* config = (config_t*) req->user_ctx;

    char content[512];
    size_t content_length = req->content_len;
    int ret = httpd_req_recv(req, content, content_length);

    if(ret <= 0) {
        if(ret == HTTPD_SOCK_ERR_TIMEOUT) {
            httpd_resp_send_408(req);
        }

        return ESP_FAIL;
    }

    cJSON* root = cJSON_Parse(content);
    if(root == NULL) {
        ESP_LOGI(TAG, "Error parsing JSON");
        httpd_resp_send_custom_err(req, "400", "Invalid JSON");
        return ESP_FAIL;
    }

    cJSON* api_key = cJSON_GetObjectItem(root, "api_key");
    cJSON* ssid = cJSON_GetObjectItem(root, "ssid");
    cJSON* password = cJSON_GetObjectItem(root, "password");
    cJSON* motion = cJSON_GetObjectItem(root, "motion");
    cJSON* sound = cJSON_GetObjectItem(root, "sound");
    cJSON* gas = cJSON_GetObjectItem(root, "gas");
    cJSON* fire = cJSON_GetObjectItem(root, "fire");

    if(api_key == NULL || ssid == NULL || password == NULL || motion == NULL || sound == NULL || gas == NULL || fire == NULL) {
        httpd_resp_send_custom_err(req, "400", "Missing required fields");
        cJSON_Delete(root);
        return ESP_FAIL;
    }

    const char* res = "{\"status\": \"sucesss\"}";

    httpd_resp_set_status(req, "200 OK");
    httpd_resp_set_type(req, "application/json");
    httpd_resp_send(req, res, strlen(res));

    if (config->api_key != NULL) free(config->api_key);
    if (config->ssid != NULL) free(config->ssid);
    if (config->password != NULL) free(config->password);

    config->api_key = strdup(api_key->valuestring);
    config->ssid = strdup(ssid->valuestring);
    config->password = strdup(password->valuestring);

    config->motion = motion->valueint;
    config->sound = sound->valueint;
    config->gas = gas->valueint;
    config->fire = fire->valueint;

    cJSON_Delete(root);

    esp32_config_received = true;
    
    return ESP_OK;
}

httpd_handle_t config_server_init(config_t* config) {
    httpd_config_t config_httpd = HTTPD_DEFAULT_CONFIG();

    if (httpd_start(&handle, &config_httpd) != ESP_OK) {
        ESP_LOGE(TAG, "Error starting HTTP server");
        return NULL;
    }

    httpd_uri_t config_uri = {
        .uri = "/api/config",
        .method = HTTP_POST,
        .handler = config_handler,
        .user_ctx = config
    };

    httpd_uri_t check_uri = {
        .uri = "/api/check",
        .method = HTTP_GET,
        .handler = check_handler,
        .user_ctx = NULL
    };

    if (httpd_register_uri_handler(handle, &config_uri) != ESP_OK) {
        ESP_LOGE(TAG, "Register config_handler to the HTTP server failed.");
        return NULL;
    }
    if (httpd_register_uri_handler(handle, &check_uri) != ESP_OK) {
        ESP_LOGE(TAG, "Register check_handler to the HTTP server failed.");
        return NULL;
    }

    ESP_LOGI(TAG, "The HTTP configuration server is up.");

    return handle;
}

void wait_for_configuration(u_int8_t seconds_between_checks) {
    while(!esp32_config_received) {
        ESP_LOGI(TAG, "Configuration wasn't received yet. Checking again in %d seconds.", seconds_between_checks);
        vTaskDelay((1000 * seconds_between_checks) / portTICK_PERIOD_MS);
    }
    ESP_LOGI(TAG, "Configuration received.");
}