package com.barnattwu.rosetta.job.dto;

import java.util.UUID;

public class CreateJobResponse {
    private UUID jobId;
    private String uploadUrl;

    public CreateJobResponse(UUID jobId, String uploadUrl) {
        this.jobId = jobId;
        this.uploadUrl = uploadUrl;
    }

    public UUID getJobId() {
        return jobId;
    }

    public String getUploadUrl() {
        return uploadUrl;
    }
}
