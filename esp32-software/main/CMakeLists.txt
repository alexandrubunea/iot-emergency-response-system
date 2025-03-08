idf_component_register(SRCS "main.c"
                    INCLUDE_DIRS "."
                    REQUIRES config_storage wifi_manager config_server motion_sensor sound_sensor fire_sensor)
