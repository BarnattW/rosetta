package com.barnattwu.rosetta.translation;

import java.util.UUID;

import com.barnattwu.rosetta.job.Job;
import com.barnattwu.rosetta.job.JobEventPublisher;
import com.barnattwu.rosetta.job.JobRepository;
import com.barnattwu.rosetta.job.JobStatus;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class TranslationConsumer {

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
    Job job = null;
    try {
      job = jobRepository
        .findById(UUID.fromString(jobId))
        .orElseThrow(() -> new RuntimeException("Job not found: " + jobId));
      String transcript = redisTemplate.opsForValue().get("transcript:" + jobId);
      if (transcript == null) {
        throw new RuntimeException("Transcript not found in Redis for job: " + jobId);
      }

      if (!jobRepository.existsById(job.getId())) return; // deleted while translating

      job.setStatus(JobStatus.CAPTIONING);
      jobRepository.save(job);

      for (String targetLanguage : job.getTargetLanguages()) {
        translationService.translate(job, transcript, targetLanguage);
      }

      redisTemplate.delete("transcript:" + jobId);

      job.setStatus(JobStatus.COMPLETED);
      job.setCompletedAt(java.time.Instant.now());
      jobRepository.save(job);

      jobEventPublisher.publishJobCompleted(job.getId());
    } catch (Exception e) {
      if (job == null) return;
      if (!jobRepository.existsById(job.getId())) return;
      job.setStatus(JobStatus.FAILED);
      job.setErrorMessage(e.getMessage());
      jobRepository.save(job);
      jobEventPublisher.publishJobFailed(job.getId());
    }
  }
}
