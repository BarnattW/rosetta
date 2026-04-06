package com.barnattwu.rosetta.caption;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.barnattwu.rosetta.job.Job;
import com.barnattwu.rosetta.job.JobRepository;

@Service
public class CaptionService {

  private final CaptionRepository captionRepository;
  private final JobRepository jobRepository;

  public CaptionService(
    CaptionRepository captionRepository,
    JobRepository jobRepository
  ) {
    this.captionRepository = captionRepository;
    this.jobRepository = jobRepository;
  }

  /* 
    Primarly used for authorization - ensuring the job exists and belongs to the user making the request
  */
  private Job getJobForUser(UUID jobId, UUID userId) {
    Job job = jobRepository
      .findById(jobId)
      .orElseThrow(() -> new RuntimeException("Job not found"));
    if (!job.getUser().getId().equals(userId)) {
      throw new RuntimeException("Unauthorized");
    }
    return job;
  }

  public List<Caption> getCaptions(UUID jobId, UUID userId) {
    getJobForUser(jobId, userId);
    return captionRepository.findByJobIdOrderByIndex(jobId);
  }

  public Caption updateCaption(UUID jobId,UUID captionId, UUID userId, String editedText) {
    getJobForUser(jobId, userId);
    Caption caption = captionRepository
      .findById(captionId)
      .orElseThrow(() -> new RuntimeException("Caption not found"));

    caption.setEditedText(editedText);
    return captionRepository.save(caption);
  }

  public String exportSrt(UUID jobId, UUID userId) {
    getJobForUser(jobId, userId);
    List<Caption> captions = captionRepository.findByJobIdOrderByIndex(jobId);
    StringBuilder srt = new StringBuilder();

    for (Caption caption : captions) {
      String text = caption.getEditedText() != null
        ? caption.getEditedText()
        : caption.getOriginalText();
      srt.append(caption.getIndex() + 1).append("\n");
      srt
        .append(formatTime(caption.getStartTime()))
        .append(" --> ")
        .append(formatTime(caption.getEndTime()))
        .append("\n");
      srt.append(text).append("\n\n");
    }

    return srt.toString();
  }

  private String formatTime(long ms) {
    long hours = ms / 3600000;
    long minutes = (ms % 3600000) / 60000;
    long seconds = (ms % 60000) / 1000;
    long milliseconds = ms % 1000;

    return String.format(
      "%02d:%02d:%02d,%03d",
      hours,
      minutes,
      seconds,
      milliseconds
    );
  }
}
