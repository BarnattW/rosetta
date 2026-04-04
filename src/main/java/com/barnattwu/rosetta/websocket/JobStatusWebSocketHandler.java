package com.barnattwu.rosetta.websocket;

import java.io.IOException;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.barnattwu.rosetta.auth.util.JwtUtil;
import com.barnattwu.rosetta.job.Job;
import com.barnattwu.rosetta.job.JobRepository;

@Component
public class JobStatusWebSocketHandler extends TextWebSocketHandler {

    private final ConcurrentHashMap<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
    private final JwtUtil jwtUtil;
    private final JobRepository jobRepository;

    public JobStatusWebSocketHandler(JwtUtil jwtUtil, JobRepository jobRepository) {
        this.jwtUtil = jwtUtil;
        this.jobRepository = jobRepository;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String token = extractToken(session);
        if (token == null || !jwtUtil.validateToken(token)) {
            session.close(CloseStatus.POLICY_VIOLATION);
            return;
        }
        
        String jobId = extractJobId(session);
        UUID userId = jwtUtil.getUserId(token);

        Job job = jobRepository.findById(UUID.fromString(jobId)).orElse(null);
        if (job == null || !job.getId().equals(userId)) {
            session.close(CloseStatus.POLICY_VIOLATION);
            return;
        }

        sessions.put(jobId, session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String jobId = extractJobId(session);
        sessions.remove(jobId);
    }

    public void pushStatus(String jobId, String status) {
        WebSocketSession session = sessions.get(jobId);
        if (session != null && session.isOpen()) {
            try {
                session.sendMessage(new TextMessage("{\"status\": \"" + status + "\"}"));
                if (status.equals("COMPLETED") || status.equals("FAILED")) {
                    session.close(CloseStatus.NORMAL);
                    sessions.remove(jobId);
                }
            } catch (IOException e) {
                sessions.remove(jobId);
            }
        }
    }

    private String extractJobId(WebSocketSession session) {
        String path = session.getUri().getPath();
        return path.substring(path.lastIndexOf('/') + 1);
    }

    private String extractToken(WebSocketSession session) {
        String query = session.getUri().getQuery();
        if (query == null) return null;
        for (String param : query.split("&")) {
            if (param.startsWith("token=")) {
                return param.substring(6);
            }
        }
        return null;
    }
}
