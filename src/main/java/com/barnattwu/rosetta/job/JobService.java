package com.barnattwu.rosetta.job;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.barnattwu.rosetta.job.dto.CreateJobRequest;
import com.barnattwu.rosetta.job.dto.CreateJobResponse;
import com.barnattwu.rosetta.storage.StorageService;
import com.barnattwu.rosetta.user.User;
import com.barnattwu.rosetta.user.UserRepository;

@Service
public class JobService {
    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final StorageService storageService;

    public JobService(JobRepository jobRepository, UserRepository userRepository, StorageService storageService) {
        this.jobRepository = jobRepository;
        this.userRepository = userRepository;
        this.storageService = storageService;
    }

    public CreateJobResponse createJob(UUID userId, CreateJobRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Job job = new Job();
        job.setUser(user);
        job.setSourceLanguage(request.getSourceLanguage());
        job.setTargetLanguage(request.getTargetLanguage());
        job.setStatus(JobStatus.PENDING);
        jobRepository.save(job);

        Job saved = jobRepository.save(job);

        String storageKey = storageService.getStorageKey(saved.getId(), request.getFilename());
        saved.setVideoStorageKey(storageKey);
        jobRepository.save(saved);

        String uploadUrl = storageService.generateUploadUrl(saved.getId(), request.getFilename());
        
        return new CreateJobResponse(saved.getId(), uploadUrl);
    }

    public Job getJob(UUID jobId) {
        return jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found"));
    }
}
