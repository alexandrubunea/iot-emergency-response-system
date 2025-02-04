idf_component_register(SRCS "config_server.c"
                    INCLUDE_DIRS "include"
                    REQUIRES esp_http_server config_storage json)
