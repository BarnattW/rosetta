package com.barnattwu.rosetta.job;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * On startup, any job stuck in a processing state means the server was killed
 * mid-pipeline. Mark them FAILED so the user can see what happened and retry.
 */
@Component
public class JobRecoveryService implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(JobRecoveryService.class);

    private static final List<JobStatus> STUCK_STATUSES = List.of(
        JobStatus.TRANSCRIBING,
        JobStatus.TRANSLATING,
        JobStatus.CAPTIONING
    );

    private final JobRepository jobRepository;

    public JobRecoveryService(JobRepository jobRepository) {
        this.jobRepository = jobRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        List<Job> stuck = jobRepository.findByStatusIn(STUCK_STATUSES);
        if (stuck.isEmpty()) return;

        stuck.forEach(job -> {
            job.setStatus(JobStatus.FAILED);
            job.setErrorMessage("Processing was interrupted by a server restart.");
        });
        jobRepository.saveAll(stuck);
        log.warn("Recovered {} stuck job(s) on startup", stuck.size());
    }
}
