package com.barnattwu.rosetta.job;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface JobRepository extends JpaRepository<Job, UUID> {
    List<Job> findByUserIdOrderByCreatedAtDesc(UUID userId);
    List<Job> findByStatusIn(List<JobStatus> statuses);
}
