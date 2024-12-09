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

#pragma once

#include <memory>

#include <freertos/FreeRTOS.h>
#include <freertos/task.h>
#include <freertos/queue.h>

#include "sensors/MotionSensor.hpp"

class MotionEvent {
    public:
        MotionEvent(std::unique_ptr<MotionSensor> &sensor);
        ~MotionEvent();
    private:
        std::unique_ptr<MotionSensor> m_sensor;
        QueueHandle_t m_queue;
        TaskHandle_t m_task;
        
        static void m_trigger(void *args);
        static void m_handle(void *args);
};