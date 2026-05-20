package com.dealio.builder.service;

import com.dealio.builder.dto.request.UpdateReraConfigRequest;
import com.dealio.builder.dto.response.ReraConfigResponse;
import com.dealio.builder.entity.Project;
import com.dealio.builder.entity.ReraConfig;
import com.dealio.builder.exception.ResourceNotFoundException;
import com.dealio.builder.repository.ReraConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReraService {

    private final ReraConfigRepository reraConfigRepository;
    private final ProjectService projectService;

    @Transactional(readOnly = true)
    public ReraConfigResponse getReraConfig(Long projectId) {
        ReraConfig config = reraConfigRepository.findByProjectId(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("ReraConfig", "projectId", projectId));
        return toResponse(config);
    }

    @Transactional
    public ReraConfigResponse updateReraConfig(UpdateReraConfigRequest request) {
        Project project = projectService.getProjectEntityById(request.projectId());
        ReraConfig config = reraConfigRepository.findByProjectId(request.projectId())
                .orElse(ReraConfig.builder().project(project).build());

        if (request.reraNumber() != null) config.setReraNumber(request.reraNumber());
        if (request.reraState() != null) config.setReraState(request.reraState());
        if (request.reraExpiry() != null) config.setReraExpiry(request.reraExpiry());
        if (request.portalUrl() != null) config.setPortalUrl(request.portalUrl());

        ReraConfig saved = reraConfigRepository.save(config);
        log.info("Updated RERA config for project: {}", request.projectId());
        return toResponse(saved);
    }

    public long getDaysToExpiry(Long projectId) {
        ReraConfig config = reraConfigRepository.findByProjectId(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("ReraConfig", "projectId", projectId));
        if (config.getReraExpiry() == null) return Long.MAX_VALUE;
        return ChronoUnit.DAYS.between(LocalDate.now(), config.getReraExpiry());
    }

    public boolean isExpiringSoon(Long projectId) {
        long days = getDaysToExpiry(projectId);
        return days >= 0 && days <= 30;
    }

    private ReraConfigResponse toResponse(ReraConfig config) {
        long daysToExpiry = config.getReraExpiry() != null
                ? ChronoUnit.DAYS.between(LocalDate.now(), config.getReraExpiry()) : Long.MAX_VALUE;
        boolean expiringSoon = daysToExpiry >= 0 && daysToExpiry <= 30;
        return new ReraConfigResponse(
                config.getId(),
                config.getProject().getId(),
                config.getProject().getName(),
                config.getReraNumber(),
                config.getReraState(),
                config.getReraExpiry(),
                config.getPortalUrl(),
                daysToExpiry,
                expiringSoon,
                config.getCreatedAt(),
                config.getUpdatedAt()
        );
    }
}
