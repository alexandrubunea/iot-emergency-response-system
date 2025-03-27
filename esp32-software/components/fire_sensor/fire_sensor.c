#include "fire_sensor.h"

#include "esp_err.h"
#include "esp_http_client.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "sensor.h"

const static char* TAG = "fire_sensor";

static void send_alarm(const char* api_key) {
	char* auth_header = NULL;
	const char* post_data = "{\"alert_type\": \"fire\"}";

	esp_http_client_config_t config = {
		.url = "http://192.168.1.133:5000/api/send_alert",
		.method = HTTP_METHOD_POST,
		.event_handler = NULL,
	};

	esp_http_client_handle_t client = esp_http_client_init(&config);
	if (!client) {
		ESP_LOGE(TAG, "Failed to initialize HTTP client");
		return;
	}

	auth_header = malloc(strlen("Bearer ") + strlen(api_key) + 1);
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

// cppcheck-suppress constParameterCallback
static void fire_sensor_event(void* pvParameters) {
	Sensor* fire_sensor = (Sensor*)pvParameters;

	while (fire_sensor->device_cfg->fire) {
		if (read_signal(fire_sensor) <= fire_sensor->treshold) {
			fire_sensor->times_triggered++;
			ESP_LOGI(TAG, "Fire detected. Times triggered: %d", fire_sensor->times_triggered);

			if (fire_sensor->times_triggered >= fire_sensor->times_to_trigger) {
				ESP_LOGI(TAG, "Fire detected %d times. Triggering alarm.",
						 fire_sensor->times_to_trigger);
				fire_sensor->times_triggered = 0;

				send_alarm(fire_sensor->device_cfg->api_key);
			}
		}

		vTaskDelay(500 / portTICK_PERIOD_MS);
	}
}

esp_err_t init_fire_sensor(int gpio, bool is_digital, int treshold, int times_to_trigger,
						   config_t* device_cfg) {
	Sensor* fire_sensor = init_sensor(gpio, is_digital, treshold, times_to_trigger, device_cfg);

	if (fire_sensor == NULL) {
		ESP_LOGE(TAG, "Failed to allocate memory for the sensor.");
		return ESP_ERR_NO_MEM;
	}

	// cppcheck-suppress constParameterCallback
	xTaskCreate(fire_sensor_event, "FIRE SENSOR", FIRE_SENSOR_STACK_SIZE, (void*)fire_sensor,
				FIRE_SENSOR_PRIORITY, NULL);

	ESP_LOGI(TAG, "Task for fire sensor created.");

	return ESP_OK;
}
