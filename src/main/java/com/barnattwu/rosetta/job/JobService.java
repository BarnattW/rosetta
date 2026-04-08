package com.barnattwu.rosetta.job;

import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.barnattwu.rosetta.caption.CaptionRepository;
import com.barnattwu.rosetta.job.dto.CreateJobRequest;
import com.barnattwu.rosetta.job.dto.CreateJobResponse;
import com.barnattwu.rosetta.storage.StorageService;
import com.barnattwu.rosetta.user.User;
import com.barnattwu.rosetta.user.UserRepository;

import jakarta.transaction.Transactional;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;

@Service
public class JobService {
    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final StorageService storageService;
    private final JobEventPublisher jobEventPublisher;
    private final CaptionRepository captionRepository;
    private final S3Client s3Client;

    @Value("${storage.bucket}")
    private String bucket;

    public JobService(JobRepository jobRepository, UserRepository userRepository, StorageService storageService, JobEventPublisher jobEventPublisher, CaptionRepository captionRepository, S3Client s3Client) {
        this.jobRepository = jobRepository;
        this.userRepository = userRepository;
        this.storageService = storageService;
        this.jobEventPublisher = jobEventPublisher;
        this.captionRepository = captionRepository;
        this.s3Client = s3Client;
    }

    public CreateJobResponse createJob(UUID userId, CreateJobRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Job job = new Job();
        job.setUser(user);
        job.setSourceLanguage(request.getSourceLanguage());
        job.setTargetLanguages(request.getTargetLanguages());
        job.setStatus(JobStatus.PENDING);

        String fileName = request.getFileName();
        String title = fileName.contains(".")
            ? fileName.substring(0, fileName.lastIndexOf('.'))
            : fileName;
        job.setTitle(title);

        Job saved = jobRepository.save(job);

        String storageKey = storageService.getStorageKey(saved.getId(), fileName);
        saved.setVideoStorageKey(storageKey);
        jobRepository.save(saved);

        String uploadUrl = storageService.generateUploadUrl(saved.getId(), request.getFileName());

        return new CreateJobResponse(saved.getId(), uploadUrl);
    }

    public void startJob(UUID jobId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found"));

        if (job.getStatus() != JobStatus.PENDING) {
            throw new RuntimeException("Job is not in a valid state to start");
        }

        try {
            s3Client.headObject(HeadObjectRequest.builder()
                    .bucket(bucket)
                    .key(job.getVideoStorageKey())
                    .build());
        } catch (NoSuchKeyException e) {
            throw new RuntimeException("Video file has not been uploaded yet");
        }

        job.setStatus(JobStatus.TRANSCRIBING);
        jobRepository.save(job);

        jobEventPublisher.publishJobCreated(jobId);
    }

    public Job getJob(UUID jobId) {
        return jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found"));
    }

    public List<Job> listJobs(UUID userId) {
        return jobRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional
    public void deleteJob(UUID jobId, UUID userId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found"));
        if (!job.getUser().getId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }
        captionRepository.deleteByJobId(jobId);
        if (job.getVideoStorageKey() != null) {
            storageService.deleteObject(job.getVideoStorageKey());
        }
        jobRepository.delete(job);
    }

    public String getVideoUrl(UUID jobId, UUID userId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found"));
        if (!job.getUser().getId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }
        return storageService.generateViewUrl(job.getVideoStorageKey());
    }
}
