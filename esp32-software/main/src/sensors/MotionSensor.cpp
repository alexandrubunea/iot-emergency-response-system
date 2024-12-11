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

#include <driver/gpio.h>

#include "esp_log.h"
#include "Configuration.hpp"
#include "sensors/MotionSensor.hpp"

MotionSensor::MotionSensor(gpio_num_t pin): m_pin(pin) {
    gpio_config_t io_conf = {
        .pin_bit_mask = 1ULL << m_pin,
        .mode = GPIO_MODE_INPUT,
        .pull_up_en = GPIO_PULLUP_DISABLE,
        .pull_down_en = GPIO_PULLDOWN_DISABLE,
        .intr_type = GPIO_INTR_POSEDGE
    };

    gpio_config(&io_conf);

    LOGI("MotionSensor", "Motion sensor initialized");
}

void MotionSensor::attachInterrupt(void (*handler)(void*), void* args) {
    gpio_install_isr_service(ESP_INTR_FLAG_LEVEL1);
    gpio_isr_handler_add(m_pin, handler, args);

    LOGI("MotionSensor", "Interrupt attached to motion sensor");
}