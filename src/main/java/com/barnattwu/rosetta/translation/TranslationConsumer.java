package com.barnattwu.rosetta.translation;

import java.util.UUID;

import com.barnattwu.rosetta.job.Job;
import com.barnattwu.rosetta.job.JobEventPublisher;
import com.barnattwu.rosetta.job.JobRepository;
import com.barnattwu.rosetta.job.JobStatus;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class TranslationConsumer {
  private static final Logger log = LoggerFactory.getLogger(TranslationConsumer.class);

  private final JobRepository jobRepository;
  private final TranslationService translationService;
  private final JobEventPublisher jobEventPublisher;
  private final StringRedisTemplate redisTemplate;

  public TranslationConsumer(
    JobEventPublisher jobEventPublisher,
    JobRepository jobRepository,
    StringRedisTemplate redisTemplate,
    TranslationService translationService
  ) {
    this.jobEventPublisher = jobEventPublisher;
    this.jobRepository = jobRepository;
    this.redisTemplate = redisTemplate;
    this.translationService = translationService;
  }

  @KafkaListener(topics = "job.transcribed", groupId = "translation-service")
  public void onJobTranscribed(String jobId) {
    log.info("[translation] received job.transcribed jobId={}", jobId);
    Job job = null;
    try {
      job = jobRepository
        .findById(UUID.fromString(jobId))
        .orElseThrow(() -> new RuntimeException("Job not found: " + jobId));
      String transcript = redisTemplate.opsForValue().get("transcript:" + jobId);
      if (transcript == null) {
        throw new RuntimeException("Transcript not found in Redis for job: " + jobId);
      }

      if (!jobRepository.existsById(job.getId())) {
        log.warn("[translation] job {} was deleted before translation started, discarding", jobId);
        return;
      }

      job.setStatus(JobStatus.CAPTIONING);
      jobRepository.save(job);

      for (String targetLanguage : job.getTargetLanguages()) {
        log.info("[translation] translating job {} to language={}", jobId, targetLanguage);
        translationService.translate(job, transcript, targetLanguage);
        log.info("[translation] finished language={} for job {}", targetLanguage, jobId);
      }

      redisTemplate.delete("transcript:" + jobId);

      job.setStatus(JobStatus.COMPLETED);
      job.setCompletedAt(java.time.Instant.now());
      jobRepository.save(job);

      log.info("[translation] job {} completed successfully", jobId);
      jobEventPublisher.publishJobCompleted(job.getId());
    } catch (Exception e) {
      log.error("[translation] job {} failed: {}", jobId, e.getMessage(), e);
      if (job == null) return;
      if (!jobRepository.existsById(job.getId())) return;
      job.setStatus(JobStatus.FAILED);
      job.setErrorMessage(e.getMessage());
      jobRepository.save(job);
      jobEventPublisher.publishJobFailed(job.getId());
    }
  }
}
