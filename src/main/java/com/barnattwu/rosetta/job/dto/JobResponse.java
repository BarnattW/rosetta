package com.barnattwu.rosetta.job.dto;

import com.barnattwu.rosetta.job.Job;
import com.barnattwu.rosetta.job.JobStatus;
import java.time.Instant;
import java.util.UUID;

public class JobResponse {

  private UUID id;
  private JobStatus status;
  private String sourceLanguage;
  private String targetLanguage;
  private String videoStorageKey;
  private int tokensUsed;
  private String errorMessage;
  private Instant createdAt;
  private Instant completedAt;

  public JobResponse(Job job) {
    this.id = job.getId();
    this.status = job.getStatus();
    this.sourceLanguage = job.getSourceLanguage();
    this.targetLanguage = job.getTargetLanguage();
    this.videoStorageKey = job.getVideoStorageKey();
    this.tokensUsed = job.getTokensUsed();
    this.errorMessage = job.getErrorMessage();
    this.createdAt = job.getCreatedAt();
    this.completedAt = job.getCompletedAt();
  }

  public UUID getId() {
    return id;
  }

  public JobStatus getStatus() {
    return status;
  }

  public String getSourceLanguage() {
    return sourceLanguage;
  }

  public String getTargetLanguage() {
    return targetLanguage;
  }

  public String getVideoStorageKey() {
    return videoStorageKey;
  }

  public int getTokensUsed() {
    return tokensUsed;
  }

  public String getErrorMessage() {
    return errorMessage;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getCompletedAt() {
    return completedAt;
  }
}
