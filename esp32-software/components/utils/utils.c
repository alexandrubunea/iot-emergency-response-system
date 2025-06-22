#include "utils.h"

#include "ctype.h"
#include "esp_crt_bundle.h"
#include "esp_http_client.h"
#include "esp_log.h"

static const char* TAG = "utils";

static char* lowercase_string(const char* str) {
	char* lowercase_str = strdup(str);

	if (!lowercase_str) {
		ESP_LOGE(TAG, "Failed to allocate memory for lowercase string");
		return NULL;
	}

	for (int i = 0; lowercase_str[i]; i++) {
		lowercase_str[i] = tolower((unsigned char)lowercase_str[i]);
	}

	return lowercase_str;
}

static char* create_post_data(const char* json_format, const char* value, const char* message) {
	size_t size;
	char* post_data;
	int message_size = (message != NULL) ? strlen(message) : 0;

	size = (message_size > 0) ? snprintf(NULL, 0, json_format, value, message) + 1
							  : snprintf(NULL, 0, json_format, value) + 1;
	post_data = malloc(size);
	if (!post_data) {
		ESP_LOGE(TAG, "Failed to allocate memory for post data");
		return NULL;
	}

	(message_size > 0) ? snprintf(post_data, size, json_format, value, message)
					   : snprintf(post_data, size, json_format, value);

	return post_data;
}

static void send_http_request(const char* url, const char* api_key, const char* post_data) {
	esp_http_client_config_t config = {
		.url = url,
		.method = HTTP_METHOD_POST,
		.crt_bundle_attach = esp_crt_bundle_attach,
		.skip_cert_common_name_check = false,
		.event_handler = NULL,
	};
	esp_http_client_handle_t client = esp_http_client_init(&config);
	if (!client) {
		ESP_LOGE(TAG, "Failed to initialize HTTP client");
		return;
	}

	char* auth_header = malloc(strlen("Bearer ") + strlen(api_key) + 1);
	if (!auth_header) {
		ESP_LOGE(TAG, "Failed to allocate memory for auth header");
		esp_http_client_cleanup(client);
		return;
	}
	snprintf(auth_header, strlen("Bearer ") + strlen(api_key) + 1, "Bearer %s", api_key);

	esp_http_client_set_header(client, "Content-Type", "application/json");
	esp_http_client_set_header(client, "Authorization", auth_header);
	esp_http_client_set_post_field(client, post_data, strlen(post_data));

	esp_err_t err = esp_http_client_perform(client);
	ESP_LOGI(TAG, "HTTP POST request sent.");
	if (err == ESP_OK) {
		ESP_LOGI(TAG, "HTTP POST Status = %d", esp_http_client_get_status_code(client));
	} else {
		ESP_LOGE(TAG, "HTTP POST request failed: %s", esp_err_to_name(err));
	}

	free(auth_header);
	esp_http_client_cleanup(client);
}

static void send_event(const char* api_key, const char* type, const char* value,
					   const char* message) {
	char* lowercase_value = lowercase_string(value);
	if (!lowercase_value) {
		return;
	}

	char format[256];
	int message_size = (message != NULL) ? strlen(message) : 0;
	(message_size > 0)
		? snprintf(format, sizeof(format), "{\"%s_type\": \"%%s\", \"message\": \"%%s\"}", type)
		: snprintf(format, sizeof(format), "{\"%s_type\": \"%%s\"}", type);

	char* post_data = create_post_data(format, lowercase_value, message);
	free(lowercase_value);
	if (!post_data) {
		return;
	}

	char url[128];
	snprintf(url, sizeof(url), "https://node.alexandrubunea.cloud/api/send_%s", type);

	send_http_request(url, api_key, post_data);
	free(post_data);

	if (message_size > 0) {
		ESP_LOGI(TAG, "%s sent: %s with message: %s", type, value, message);
	} else {
		ESP_LOGI(TAG, "%s sent: %s", type, value);
	}
}

void send_alert(const char* api_key, const char* alert_type, const char* message) {
	send_event(api_key, "alert", alert_type, message);
}

void send_malfunction(const char* api_key, const char* malfunction_type, const char* message) {
	send_event(api_key, "malfunction", malfunction_type, message);
}

void send_log(const char* api_key, const char* log_type, const char* message) {
	send_event(api_key, "log", log_type, message);
}
