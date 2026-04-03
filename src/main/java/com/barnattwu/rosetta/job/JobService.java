package com.barnattwu.rosetta.job;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.barnattwu.rosetta.job.dto.CreateJobRequest;
import com.barnattwu.rosetta.job.dto.CreateJobResponse;
import com.barnattwu.rosetta.storage.StorageService;
import com.barnattwu.rosetta.user.User;
import com.barnattwu.rosetta.user.UserRepository;

import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;

@Service
public class JobService {
    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final StorageService storageService;
    private final JobEventPublisher jobEventPublisher;
    private final S3Client s3Client;

    @Value("${storage.bucket}")
    private String bucket;

    public JobService(JobRepository jobRepository, UserRepository userRepository, StorageService storageService, JobEventPublisher jobEventPublisher, S3Client s3Client) {
        this.jobRepository = jobRepository;
        this.userRepository = userRepository;
        this.storageService = storageService;
        this.jobEventPublisher = jobEventPublisher;
        this.s3Client = s3Client;
    }

    public CreateJobResponse createJob(UUID userId, CreateJobRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Job job = new Job();
        job.setUser(user);
        job.setSourceLanguage(request.getSourceLanguage());
        job.setTargetLanguage(request.getTargetLanguage());
        job.setStatus(JobStatus.PENDING);

        Job saved = jobRepository.save(job);

        String storageKey = storageService.getStorageKey(saved.getId(), request.getFilename());
        saved.setVideoStorageKey(storageKey);
        jobRepository.save(saved);

        String uploadUrl = storageService.generateUploadUrl(saved.getId(), request.getFilename());

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
}
