package com.barnattwu.rosetta.transcription;

import java.time.Duration;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import com.barnattwu.rosetta.job.Job;
import com.barnattwu.rosetta.job.JobEventPublisher;
import com.barnattwu.rosetta.job.JobRepository;
import com.barnattwu.rosetta.job.JobStatus;

@Component
public class TranscriptionConsumer {
  private static final Logger log = LoggerFactory.getLogger(TranscriptionConsumer.class);

  private final JobRepository jobRepository;
  private final TranscriptionService transcriptionService;
  private final JobEventPublisher jobEventPublisher;
  private final StringRedisTemplate redisTemplate;

  public TranscriptionConsumer(
    JobRepository jobRepository,
    TranscriptionService transcriptionService,
    JobEventPublisher jobEventPublisher,
    StringRedisTemplate redisTemplate
  ) {
    this.jobRepository = jobRepository;
    this.transcriptionService = transcriptionService;
    this.jobEventPublisher = jobEventPublisher;
    this.redisTemplate = redisTemplate;
  }

  @KafkaListener(topics = "job.created", groupId = "transcription-service")
  public void onJobCreated(String jobId) {
    log.info("[transcription] received job.created jobId={}", jobId);
    Job job = null;
    try {
      job = jobRepository.findById(UUID.fromString(jobId))
        .orElseThrow(() -> new RuntimeException("Job not found: " + jobId));

      String transcript = transcriptionService.transcribe(job.getVideoStorageKey(), "rosetta-videos");

      if (!jobRepository.existsById(job.getId())) {
        log.warn("[transcription] job {} was deleted during transcription, discarding result", jobId);
        return;
      }

      redisTemplate.opsForValue().set("transcript:" + jobId, transcript, Duration.ofHours(1));
      job.setStatus(JobStatus.TRANSLATING);
      job.setErrorMessage(null);
      jobRepository.save(job);
      log.info("[transcription] job {} transcribed successfully, publishing job.transcribed", jobId);
      jobEventPublisher.publishJobTranscribed(job.getId());
    } catch (Exception e) {
      log.error("[transcription] job {} failed: {}", jobId, e.getMessage(), e);
      if (job == null) return;
      if (!jobRepository.existsById(job.getId())) return;
      job.setStatus(JobStatus.FAILED);
      job.setErrorMessage(e.getMessage());
      jobRepository.save(job);
      jobEventPublisher.publishJobFailed(job.getId());
    }
  }
}
