idf_component_register(
                    SRCS 
                        "esp32-software.cpp"
                        "src/sensors/MotionSensor.cpp"
                        "src/events/MotionEvent.cpp"
                    INCLUDE_DIRS "." "src/include")