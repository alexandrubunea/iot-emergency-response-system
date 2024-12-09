#include <stdio.h>

#include <freertos/FreeRTOS.h>
#include <freertos/task.h>

#include "esp_log.h"

extern "C" void app_main(void)
{
    char *taskName = pcTaskGetName(NULL);
    ESP_LOGI(taskName, "Hello, world!\n");
    
    while (1)
    {
        ;;
    }
}
