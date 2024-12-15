#include <stdio.h>
#include <memory>

#include <freertos/FreeRTOS.h>
#include <freertos/task.h>

#include "esp_log.h"

#include "Configuration.hpp"
#include "sensors/MotionSensor.hpp"
#include "events/MotionEvent.hpp"

extern "C" void app_main(void)
{
    LOGI("Main", "ESP32 software started");
    
    Configuration configuration;

    while(configuration.getFlag() == CONFIGURATION_IN_PROCESS) {
        LOGI("Main", "Waiting for configuration to finish");
        vTaskDelay(1000 / portTICK_PERIOD_MS);
    }

    if(configuration.getFlag() == CONFIGURATION_ERROR) {
        LOGI("Main", "Configuration error, ESP32 will not start.");
        return;
    }

    if(configuration.getFlag() == CONFIGURATION_COMPLETED) {
        LOGI("Main", "Configuration completed, ESP32 will start in STA mode");
        return;
    }

    return;

    std::unique_ptr<MotionSensor> motionSensor = std::make_unique<MotionSensor>(GPIO_NUM_21);
    MotionEvent event(motionSensor);

    while(true) {
        vTaskDelay(1000 / portTICK_PERIOD_MS);
    }
}
