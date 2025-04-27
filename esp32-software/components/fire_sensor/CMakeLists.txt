idf_component_register(SRCS "fire_sensor.c"
                    INCLUDE_DIRS "include"
                    REQUIRES sensor utils ina219 current_monitor)
