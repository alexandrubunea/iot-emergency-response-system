#include "wifi_manager.h"

#include <stdio.h>
#include <string.h>

#include "esp_event.h"
#include "esp_log.h"
#include "esp_netif.h"
#include "esp_wifi.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "lwip/inet.h"

static const char* TAG = "wifi_manager";

static void wifi_event_handler(void* arg, esp_event_base_t event_base, int32_t event_id,
							   void* event_data) {
	if (event_base == WIFI_EVENT) {
		switch (event_id) {
			case WIFI_EVENT_AP_STACONNECTED:
				ESP_LOGW(TAG, "Device connected to ESP32.");
				break;
			case WIFI_EVENT_AP_STADISCONNECTED:
				ESP_LOGW(TAG, "Device disconnected from ESP32.");
				break;
			case WIFI_EVENT_STA_CONNECTED:
				ESP_LOGW(TAG, "Connected to local network.");
				break;
			case WIFI_EVENT_STA_DISCONNECTED:
				ESP_LOGW(TAG, "Disconnected from local network.");
				ESP_LOGW(TAG, "Trying to reconnect");

				break;
		}
	}
}

static wifi_status wifi_initialize() {
	esp_err_t err;
	wifi_init_config_t wifi_init_cfg = WIFI_INIT_CONFIG_DEFAULT();

	err = esp_netif_init();
	if (err != ESP_OK) {
		ESP_LOGE(TAG, "Error initializing TCP/IP stack: %s", esp_err_to_name(err));
		return WIFI_STATUS_ERROR;
	}

	err = esp_wifi_init(&wifi_init_cfg);
	if (err != ESP_OK) {
		ESP_LOGE(TAG, "Error initializing Wi-Fi driver: %s", esp_err_to_name(err));
		return WIFI_STATUS_ERROR;
	}

	err = esp_event_loop_create_default();
	if (err != ESP_OK) {
		ESP_LOGE(TAG, "Error creating default event loop: %s", esp_err_to_name(err));
		return WIFI_STATUS_ERROR;
	}

	err = esp_event_handler_register(WIFI_EVENT, ESP_EVENT_ANY_ID, wifi_event_handler, NULL);
	if (err != ESP_OK) {
		ESP_LOGE(TAG, "Error registering Wi-Fi event handler: %s", esp_err_to_name(err));
		return WIFI_STATUS_ERROR;
	}

	return WIFI_STATUS_OK;
}

static wifi_status wifi_config_sta_mode(const char* sta_ssid, const char* sta_pass) {
	if ((sta_ssid == NULL || sta_pass == NULL) || (!strlen(sta_ssid) || !strlen(sta_pass))) {
		ESP_LOGE(TAG, "Station SSID or password was not provided.");
		return WIFI_STATUS_ERROR;
	}

	wifi_config_t sta_config = {0};

	const esp_netif_t* sta_netif = esp_netif_create_default_wifi_sta();
	if (sta_netif == NULL) {
		ESP_LOGE(TAG, "Error trying to create TCP/IP stack for STA mode.");
		return WIFI_STATUS_ERROR;
	}

	strncpy((char*)sta_config.sta.ssid, sta_ssid, sizeof(sta_config.sta.ssid) - 1);
	sta_config.sta.ssid[sizeof(sta_config.sta.ssid) - 1] = '\0';
	strncpy((char*)sta_config.sta.password, sta_pass, sizeof(sta_config.sta.password) - 1);
	sta_config.sta.password[sizeof(sta_config.sta.password) - 1] = '\0';

	esp_err_t err = esp_wifi_set_config(WIFI_IF_STA, &sta_config);
	if (err != ESP_OK) {
		ESP_LOGE(TAG, "Error setting STA config: %s", esp_err_to_name(err));
		return WIFI_STATUS_ERROR;
	}

	return WIFI_STATUS_OK;
}

static wifi_status wifi_config_ap_mode(const char* ap_ssid, const char* ap_pass) {
	if ((ap_ssid == NULL || ap_pass == NULL) || (!strlen(ap_ssid) || !strlen(ap_pass))) {
		ESP_LOGE(TAG, "Access Point SSID or password was not provided.");
		return WIFI_STATUS_ERROR;
	}

	wifi_config_t ap_config = {0};
	esp_err_t err;
	esp_netif_ip_info_t ip_info;

	esp_netif_t* ap_netif = esp_netif_create_default_wifi_ap();
	if (ap_netif == NULL) {
		ESP_LOGE(TAG, "Error trying to create TCP/IP stack for AP mode.");
		return WIFI_STATUS_ERROR;
	}

	strncpy((char*)ap_config.ap.ssid, ap_ssid, sizeof(ap_config.ap.ssid) - 1);
	ap_config.ap.ssid[sizeof(ap_config.ap.ssid) - 1] = '\0';
	strncpy((char*)ap_config.ap.password, ap_pass, sizeof(ap_config.ap.password) - 1);
	ap_config.ap.password[sizeof(ap_config.ap.password) - 1] = '\0';

	ap_config.ap.ssid_len = strlen(ap_ssid);
	ap_config.ap.channel = 6;
	ap_config.ap.authmode = WIFI_AUTH_WPA2_PSK;
	ap_config.ap.max_connection = 4;
	ap_config.ap.pmf_cfg.capable = true;
	ap_config.ap.pmf_cfg.required = false;

	err = esp_wifi_set_config(WIFI_IF_AP, &ap_config);
	if (err != ESP_OK) {
		ESP_LOGE(TAG, "Error setting AP config: %s", esp_err_to_name(err));
		return WIFI_STATUS_ERROR;
	}

	err = esp_netif_dhcps_stop(ap_netif);
	if (err != ESP_OK) {
		ESP_LOGE(TAG, "Failed to stop DHCP server: %s", esp_err_to_name(err));
		return WIFI_STATUS_ERROR;
	}

	IP4_ADDR(&ip_info.ip, 192, 168, 4, 1);
	IP4_ADDR(&ip_info.gw, 192, 168, 4, 1);
	IP4_ADDR(&ip_info.netmask, 255, 255, 255, 0);

	err = esp_netif_set_ip_info(ap_netif, &ip_info);
	if (err != ESP_OK) {
		ESP_LOGE(TAG, "Error setting static IP for AP: %s", esp_err_to_name(err));
		return WIFI_STATUS_ERROR;
	}

	err = esp_netif_dhcps_start(ap_netif);
	if (err != ESP_OK) {
		ESP_LOGE(TAG, "Error starting DHCP server: %s", esp_err_to_name(err));
		return WIFI_STATUS_ERROR;
	}

	return WIFI_STATUS_OK;
}

wifi_status wifi_init(wifi_mode_t mode, char* sta_ssid, char* sta_pass, char* ap_ssid,
					  char* ap_pass) {
	if (wifi_initialize() == WIFI_STATUS_ERROR) return WIFI_STATUS_ERROR;

	esp_err_t err;

	err = esp_wifi_set_mode(mode);
	if (err != ESP_OK) {
		ESP_LOGE(TAG, "Error setting Wi-Fi mode: %s", esp_err_to_name(err));
		return WIFI_STATUS_ERROR;
	}

	if (mode == WIFI_MODE_AP && wifi_config_ap_mode(ap_ssid, ap_pass) == WIFI_STATUS_ERROR)
		return WIFI_STATUS_ERROR;

	if (mode == WIFI_MODE_STA && wifi_config_sta_mode(sta_ssid, sta_pass) == WIFI_STATUS_ERROR)
		return WIFI_STATUS_ERROR;

	err = esp_wifi_start();
	if (err != ESP_OK) {
		ESP_LOGE(TAG, "Error starting Wi-Fi: %s", esp_err_to_name(err));
		return WIFI_STATUS_ERROR;
	}

	if (mode == WIFI_MODE_AP) {
		ESP_LOGI(TAG, "Wi-Fi started in AP mode (SSID: %s | Password: %s)", ap_ssid, ap_pass);
		return WIFI_STATUS_OK;
	}

	ESP_LOGI(TAG, "Wi-Fi started in STA mode (SSID: %s | Password: %s)", sta_ssid, sta_pass);

	err = esp_wifi_connect();
	if (err != ESP_OK) {
		ESP_LOGE(TAG, "Error connecting to Wi-Fi: %s", esp_err_to_name(err));
		return WIFI_STATUS_ERROR;
	}

	return WIFI_STATUS_OK;
}
