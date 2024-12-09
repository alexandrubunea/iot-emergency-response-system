#include <stdio.h>
#include <memory>

#include <freertos/FreeRTOS.h>
#include <freertos/task.h>

#include "esp_log.h"
#include "config.hpp"

#include "sensors/MotionSensor.hpp"
#include "events/MotionEvent.hpp"

extern "C" void app_main(void)
{
    LOGI("Main", "ESP32 software started");
    
    std::unique_ptr<MotionSensor> motionSensor = std::make_unique<MotionSensor>(GPIO_NUM_21);
    MotionEvent event(motionSensor);

    while(true) {
        vTaskDelay(1000 / portTICK_PERIOD_MS);
    }
}
