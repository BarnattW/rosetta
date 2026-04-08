package com.barnattwu.rosetta.job.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.barnattwu.rosetta.job.JobService;
import com.barnattwu.rosetta.job.dto.CreateJobRequest;
import com.barnattwu.rosetta.job.dto.CreateJobResponse;
import com.barnattwu.rosetta.job.dto.JobResponse;

@RestController
@RequestMapping("/api/jobs")
public class JobController {
    private final JobService jobService;
    
    public JobController(JobService jobService) {
        this.jobService = jobService;
    }

    @PostMapping
    public ResponseEntity<CreateJobResponse> createJob(
        @RequestBody CreateJobRequest request,
        Authentication authentication
    ) {
        UUID userId = (UUID) authentication.getPrincipal();
        CreateJobResponse response = jobService.createJob(userId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{jobId}")
    public ResponseEntity<JobResponse> getJob(@PathVariable UUID jobId) {
        return ResponseEntity.ok(new JobResponse(jobService.getJob(jobId)));
    }

    @PostMapping("/{jobId}/start")
    public ResponseEntity<Void> startJob(@PathVariable UUID jobId) {
        jobService.startJob(jobId);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<List<JobResponse>> listJobs(Authentication authentication) {
        UUID userId = (UUID) authentication.getPrincipal();
        List<JobResponse> jobs = jobService.listJobs(userId).stream()
            .map(JobResponse::new)
            .toList();
        return ResponseEntity.ok(jobs);
    }

    @DeleteMapping("/{jobId}")
    public ResponseEntity<Void> deleteJob(@PathVariable UUID jobId, Authentication authentication) {
        UUID userId = (UUID) authentication.getPrincipal();
        jobService.deleteJob(jobId, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{jobId}/video-url")
    public ResponseEntity<String> getVideoUrl(@PathVariable UUID jobId, Authentication authentication) {
        UUID userId = (UUID) authentication.getPrincipal();
        return ResponseEntity.ok(jobService.getVideoUrl(jobId, userId));
    }
}
