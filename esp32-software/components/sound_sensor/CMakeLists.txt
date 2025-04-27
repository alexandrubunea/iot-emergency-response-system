idf_component_register(SRCS "sound_sensor.c"
                    INCLUDE_DIRS "include"
                    REQUIRES sensor config_storage utils current_monitor ina219)
