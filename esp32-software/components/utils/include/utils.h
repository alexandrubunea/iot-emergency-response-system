#ifndef UTILS_H
#define UTILS_H

/**
 * @brief Sends an alert notification to the communication node
 *
 * This function transmits an emergency alert to the central monitoring system
 * using the provided API key for authentication.
 *
 * @param api_key Authentication key for the communication node
 * @param alert_type Type of emergency alert (e.g., "fire", "sound", "motion")
 * @param message Additional information about the alert
 *
 * @return None
 *
 * @note This function performs network operations and may block until
 * the transmission is complete or times out.
 */
void send_alert(const char* api_key, const char* alert_type, const char* message);

/**
 * @brief Sends a malfunction notification to the communication node
 *
 * This function transmits a malfunction alert to the central monitoring system
 * using the provided API key for authentication.
 *
 * @param api_key Authentication key for the communication node
 * @param malfunction_type Type of malfunction (e.g., "sensor failure", "battery low")
 * @param message Additional information about the malfunction
 *
 * @return None
 *
 * @note This function performs network operations and may block until
 * the transmission is complete or times out.
 */
void send_malfunction(const char* api_key, const char* malfunction_type, const char* message);

/**
 * @brief Sends a log message to the communication node
 *
 * This function transmits a log entry to the configured logging endpoint
 * using the provided API key for authentication.
 *
 * @param api_key Authentication key for the communication node
 * @param log_type Category or type of log being sent (e.g., "online ping", "info", "warning")
 * @param message The log message to be sent
 *
 * @return None
 */
void send_log(const char* api_key, const char* log_type, const char* message);

#endif
