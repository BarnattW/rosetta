package com.barnattwu.rosetta.job;

import java.util.UUID;

import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class JobEventPublisher {
    private final KafkaTemplate<String, String> kafkaTemplate;

    public JobEventPublisher(KafkaTemplate<String, String> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publishJobCreated(UUID jobId) {
        kafkaTemplate.send("job.created", jobId.toString());
    }

    public void publishJobTranscribed(UUID jobId) {
        kafkaTemplate.send("job.transcribed", jobId.toString());
    }

    public void publishJobTranslated(UUID jobId) {
        kafkaTemplate.send("job.translated", jobId.toString());
    }

    public void publishJobCompleted(UUID jobId) {
        kafkaTemplate.send("job.completed", jobId.toString());
    }

    public void publishJobFailed(UUID jobId) {
        kafkaTemplate.send("job.failed", jobId.toString());
    }
}
