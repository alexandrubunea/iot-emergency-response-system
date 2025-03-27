idf_component_register(SRCS "sensor.c"
                    INCLUDE_DIRS "include"
                    REQUIRES driver esp_adc config_storage)
