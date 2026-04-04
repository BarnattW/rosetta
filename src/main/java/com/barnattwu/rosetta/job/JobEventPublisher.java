package com.barnattwu.rosetta.job;

import java.util.UUID;

import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import com.barnattwu.rosetta.websocket.JobStatusWebSocketHandler;

@Component
public class JobEventPublisher {
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final JobStatusWebSocketHandler jobStatusWebSocketHandler;

    public JobEventPublisher(KafkaTemplate<String, String> kafkaTemplate, JobStatusWebSocketHandler jobStatusWebSocketHandler) {
        this.kafkaTemplate = kafkaTemplate;
        this.jobStatusWebSocketHandler = jobStatusWebSocketHandler;
    }

    public void publishJobCreated(UUID jobId) {
        kafkaTemplate.send("job.created", jobId.toString());
    }

    public void publishJobTranscribed(UUID jobId) {
        kafkaTemplate.send("job.transcribed", jobId.toString());
        jobStatusWebSocketHandler.pushStatus(jobId.toString(), "TRANSLATING");
    }

    public void publishJobTranslated(UUID jobId) {
        kafkaTemplate.send("job.translated", jobId.toString());
    }

    public void publishJobCompleted(UUID jobId) {
        kafkaTemplate.send("job.completed", jobId.toString());
        jobStatusWebSocketHandler.pushStatus(jobId.toString(), "COMPLETED");
    }

    public void publishJobFailed(UUID jobId) {
        kafkaTemplate.send("job.failed", jobId.toString());
        jobStatusWebSocketHandler.pushStatus(jobId.toString(), "FAILED");
    }
}
