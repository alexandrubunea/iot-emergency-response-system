#define     DEBUG_MODE      1

#ifdef DEBUG_MODE
    #define     LOGI(tag, text) ESP_LOGI(tag, text);
#else
    #define     LOGI(tag, text)
#endif

#define    MOTION_EVENT_REQUIRED_TRIGGERS    2
#define    MOTION_EVENT_TIMEFRAME_TRIGGERS    20000