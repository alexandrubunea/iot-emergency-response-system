#define     DEBUG_MODE      1

#ifdef DEBUG_MODE
    #define     LOGI(tag, text) ESP_LOGI(tag, text);
#else
    #define     LOGI(tag, text)
#endif