package com.barnattwu.rosetta.caption;

import java.util.UUID;

import com.barnattwu.rosetta.job.Job;
import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "captions")
public class Caption {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @JsonIgnore
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "job_id", nullable = false)
  private Job job;

  @Column(nullable = false)
  private int index;

  @Column(nullable = false)
  private long startTime;

  @Column(nullable = false)
  private long endTime;

  @Column(nullable = false, columnDefinition = "TEXT")
  private String originalText;

  @Column(nullable = false, columnDefinition = "TEXT")
  private String translatedText;

  @Column(columnDefinition = "TEXT")
  private String editedText;

  public UUID getId() {
    return id;
  }

  public Job getJob() {
    return job;
  }

  public void setJob(Job job) {
    this.job = job;
  }

  public int getIndex() {
    return index;
  }

  public void setIndex(int index) {
    this.index = index;
  }

  public long getStartTime() {
    return startTime;
  }

  public void setStartTime(long startTime) {
    this.startTime = startTime;
  }

  public long getEndTime() {
    return endTime;
  }

  public void setEndTime(long endTime) {
    this.endTime = endTime;
  }

  public String getOriginalText() {
    return originalText;
  }

  public void setOriginalText(String originalText) {
    this.originalText = originalText;
  }

  public String getTranslatedText() {
    return translatedText;
  }

  public void setTranslatedText(String translatedText) {
    this.translatedText = translatedText;
  }

  public String getEditedText() {
    return editedText;
  }

  public void setEditedText(String editedText) {
    this.editedText = editedText;
  }
}
