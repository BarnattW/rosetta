package com.barnattwu.rosetta.job;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.barnattwu.rosetta.user.User;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "jobs")
public class Job {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false)
    private JobStatus status = JobStatus.PENDING;

    @Column
    private String sourceLanguage;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "job_target_languages", joinColumns = @JoinColumn(name = "job_id"))
    @Column(name = "language")
    private List<String> targetLanguages = new ArrayList<>();

    @Column
    private String title;

    @Column
    private String videoStorageKey;

    @Column(nullable=false)
    private int tokensUsed = 0;

    @Column
    private String errorMessage;

    @Column(nullable=false, updatable=false)
    private Instant createdAt;

    @Column
    private Instant completedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }

    public UUID getId() { return id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public JobStatus getStatus() { return status; }
    public void setStatus(JobStatus status) { this.status = status; }

    public String getSourceLanguage() { return sourceLanguage; }
    public void setSourceLanguage(String sourceLanguage) { this.sourceLanguage = sourceLanguage; }

    public List<String> getTargetLanguages() { return targetLanguages; }
    public void setTargetLanguages(List<String> targetLanguages) { this.targetLanguages = targetLanguages; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getVideoStorageKey() { return videoStorageKey; }
    public void setVideoStorageKey(String videoStorageKey) { this.videoStorageKey = videoStorageKey; }

    public int getTokensUsed() { return tokensUsed; }
    public void setTokensUsed(int tokensUsed) { this.tokensUsed = tokensUsed; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public Instant getCreatedAt() { return createdAt; }

    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
}
