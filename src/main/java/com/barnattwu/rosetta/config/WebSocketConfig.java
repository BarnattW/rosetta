package com.barnattwu.rosetta.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

import com.barnattwu.rosetta.websocket.JobStatusWebSocketHandler;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final JobStatusWebSocketHandler jobStatusWebSocketHandler;

    public WebSocketConfig(JobStatusWebSocketHandler jobStatusWebSocketHandler) {
        this.jobStatusWebSocketHandler = jobStatusWebSocketHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(jobStatusWebSocketHandler, "/ws/jobs/**")
                .setAllowedOrigins("*");
    }
}
