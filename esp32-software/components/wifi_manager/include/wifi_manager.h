#ifndef WIFI_MANAGER_H
#define WIFI_MANAGER_H

#include "esp_wifi.h"

typedef enum { WIFI_STATUS_OK = 0, WIFI_STATUS_ERROR = -1 } wifi_status;

/**
 * @brief Initializes the Wi-Fi module in either STA (Station) or AP (Access
 * Point) mode.
 *
 * This function sets up the Wi-Fi driver, initializes network interfaces,
 * configures the selected mode, and starts the Wi-Fi connection. If running in
 * STA mode, it connects to the specified network. If running in AP mode, it
 * sets up an access point with the provided credentials and assigns a static
 * IP.
 *
 * @param mode The Wi-Fi mode to initialize.
 * @param sta_ssid The SSID of the Wi-Fi network to connect to in STA mode.
 * @param sta_pass The password for the STA network.
 * @param ap_ssid The SSID for the ESP32's AP mode.
 * @param ap_pass The password for the AP mode.
 *
 * @return `WIFI_STATUS_OK` if successful \\
 * @return `WIFI_STATUS_ERROR` otherwise.
 *
 * @note In STA mode, the ESP32 will attempt to connect to the provided network.
 *       In AP mode, a DHCP server is set up with a default static IP
 * (192.168.4.1).
 *
 * @warning Ensure that the provided SSID and password are valid and within
 * length limits. If running in AP mode, the password must be at least 8
 * characters when using WPA2.
 */
wifi_status wifi_init(wifi_mode_t mode, char* sta_ssid, char* sta_pass, char* ap_ssid,
					  char* ap_pass);

#endif
