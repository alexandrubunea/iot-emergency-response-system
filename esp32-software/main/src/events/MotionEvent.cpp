/*
 * Copyright (c) 2024 Alexandru Bunea
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

#include "esp_log.h"

#include "config.hpp"
#include "events/MotionEvent.hpp"

MotionEvent::MotionEvent(std::unique_ptr<MotionSensor> &sensor)
    : m_times(0), m_last_trigger_time(0) {
    
    m_sensor = std::move(sensor);
    m_sensor->attachInterrupt(MotionEvent::m_trigger, this);
    LOGI("MotionEvent", "Motion event attached to sensor");

    m_queue = xQueueCreate(10, sizeof(uint32_t));
    if(m_queue == NULL)
        LOGI("MotionEvent", "Failed to create queue");

    xTaskCreate(&MotionEvent::m_handle, "MotionEvent", 2048, this, 1, nullptr);
}

MotionEvent::~MotionEvent() {
    vQueueDelete(m_queue);
}

void MotionEvent::m_trigger(void *args) {
    // GPIO Interrupts are very strict, so we need to keep this function as short as possible
    // We can't use any logging functions here, it will crash the program

    uint32_t event = 1;

    MotionEvent *motionEvent = static_cast<MotionEvent*>(args);
    
    uint32_t now = xTaskGetTickCount() * portTICK_PERIOD_MS;
    if(now - motionEvent->m_last_trigger_time > MOTION_EVENT_TIMEFRAME_TRIGGERS) {
        motionEvent->m_times = 1; // The value is 1 because the current trigger should be counted
        motionEvent->m_last_trigger_time = now;

        return;
    }

    motionEvent->m_times++;
    if(motionEvent->m_times < MOTION_EVENT_REQUIRED_TRIGGERS) 
        return;


    motionEvent->m_times = 0;
    motionEvent->m_last_trigger_time = now;

    BaseType_t res = xQueueSendFromISR(motionEvent->m_queue, &event, 0);

    if(res == errQUEUE_FULL)
        LOGI("MotionEvent", "Queue is full, unable to send event");
}

void MotionEvent::m_handle(void *args) {
    uint32_t event = 0;

    MotionEvent *motionEvent = static_cast<MotionEvent*>(args);
    
    while(true) {
        if(xQueueReceive(motionEvent->m_queue, &event, portMAX_DELAY)) {
            LOGI("MotionEvent", "Motion detected, processing event");

            // To be implemented
        }

        vTaskDelay(100 / portTICK_PERIOD_MS);
    }
}