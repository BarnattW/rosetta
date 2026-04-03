package com.barnattwu.rosetta.caption;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CaptionRepository extends JpaRepository<Caption, UUID>{
    List<Caption> findByJobIdOrderByIndex(UUID jobId);
}
