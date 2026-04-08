package com.barnattwu.rosetta.caption;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface CaptionRepository extends JpaRepository<Caption, UUID> {
    List<Caption> findByJobIdOrderByIndex(UUID jobId);
    List<Caption> findByJobIdAndLanguageOrderByIndex(UUID jobId, String language);
    @Transactional
    void deleteByJobId(UUID jobId);
    @Transactional
    void deleteByJobIdAndLanguage(UUID jobId, String language);
}
