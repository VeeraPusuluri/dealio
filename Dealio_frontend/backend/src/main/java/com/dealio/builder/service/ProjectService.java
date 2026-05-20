package com.dealio.builder.service;

import com.dealio.builder.dto.request.CreateProjectRequest;
import com.dealio.builder.dto.request.UpdateProjectRequest;
import com.dealio.builder.dto.response.ProjectResponse;
import com.dealio.builder.dto.response.ProjectSummaryResponse;
import com.dealio.builder.entity.Builder;
import com.dealio.builder.entity.Project;
import com.dealio.builder.enums.ProjectStatus;
import com.dealio.builder.enums.UnitStatus;
import com.dealio.builder.exception.ResourceNotFoundException;
import com.dealio.builder.repository.ProjectRepository;
import com.dealio.builder.repository.UnitRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UnitRepository unitRepository;
    private final BuilderService builderService;

    @Transactional
    public ProjectResponse createProject(CreateProjectRequest request) {
        Builder builder = builderService.getBuilderEntityById(request.builderId());
        Project project = Project.builder()
                .builder(builder)
                .name(request.name())
                .builderDisplayName(request.builderDisplayName())
                .projectType(request.projectType())
                .status(request.status() != null ? request.status() : ProjectStatus.PRE_LAUNCH)
                .address(request.address())
                .city(request.city())
                .locality(request.locality())
                .pincode(request.pincode())
                .landmark(request.landmark())
                .mapsLink(request.mapsLink())
                .reraNumber(request.reraNumber())
                .reraState(request.reraState())
                .reraExpiry(request.reraExpiry())
                .reraPortalUrl(request.reraPortalUrl())
                .totalUnits(request.totalUnits())
                .towers(request.towers())
                .floorsPerTower(request.floorsPerTower())
                .priceMin(request.priceMin())
                .priceMax(request.priceMax())
                .pricePerSqftMin(request.pricePerSqftMin())
                .pricePerSqftMax(request.pricePerSqftMax())
                .maintenance(request.maintenance())
                .floorRise(request.floorRise())
                .possessionDate(request.possessionDate())
                .closingSoon(request.closingSoon())
                .featured(request.featured())
                .videoUrl(request.videoUrl())
                .brochureUrl(request.brochureUrl())
                .commissionType(request.commissionType())
                .commissionPercent(request.commissionPercent())
                .cpIncentive(request.cpIncentive())
                .amenities(request.amenities() != null ? request.amenities() : new HashSet<>())
                .nearbyHighlights(request.nearbyHighlights() != null ? request.nearbyHighlights() : new HashSet<>())
                .configurations(request.configurations() != null ? request.configurations() : new HashSet<>())
                .description(request.description())
                .build();

        Project saved = projectRepository.save(project);
        log.info("Created project with id: {}", saved.getId());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> getProjectsByBuilder(Long builderId, ProjectStatus status) {
        List<Project> projects = (status != null)
                ? projectRepository.findByBuilderIdAndStatus(builderId, status)
                : projectRepository.findByBuilderId(builderId);
        return projects.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProjectResponse getProjectById(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", id));
        return toResponse(project);
    }

    @Transactional
    public ProjectResponse updateProject(Long id, UpdateProjectRequest request) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", id));
        if (request.status() != null) project.setStatus(request.status());
        if (request.possessionDate() != null) project.setPossessionDate(request.possessionDate());
        if (request.closingSoon() != null) project.setClosingSoon(request.closingSoon());
        if (request.featured() != null) project.setFeatured(request.featured());
        Project saved = projectRepository.save(project);
        return toResponse(saved);
    }

    @Transactional
    public void deleteProject(Long id) {
        if (!projectRepository.existsById(id)) {
            throw new ResourceNotFoundException("Project", "id", id);
        }
        projectRepository.deleteById(id);
        log.info("Deleted project with id: {}", id);
    }

    @Transactional(readOnly = true)
    public ProjectResponse.UnitStats getProjectStats(Long projectId) {
        if (!projectRepository.existsById(projectId)) {
            throw new ResourceNotFoundException("Project", "id", projectId);
        }
        long total = unitRepository.findByProjectId(projectId).size();
        long available = unitRepository.countByProjectIdAndStatus(projectId, UnitStatus.AVAILABLE);
        long onHold = unitRepository.countByProjectIdAndStatus(projectId, UnitStatus.ON_HOLD);
        long booked = unitRepository.countByProjectIdAndStatus(projectId, UnitStatus.BOOKED);
        long sold = unitRepository.countByProjectIdAndStatus(projectId, UnitStatus.SOLD);
        return new ProjectResponse.UnitStats(total, available, onHold, booked, sold);
    }

    public Project getProjectEntityById(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", id));
    }

    private ProjectResponse toResponse(Project project) {
        ProjectResponse.UnitStats stats = null;
        try {
            long available = unitRepository.countByProjectIdAndStatus(project.getId(), UnitStatus.AVAILABLE);
            long onHold = unitRepository.countByProjectIdAndStatus(project.getId(), UnitStatus.ON_HOLD);
            long booked = unitRepository.countByProjectIdAndStatus(project.getId(), UnitStatus.BOOKED);
            long sold = unitRepository.countByProjectIdAndStatus(project.getId(), UnitStatus.SOLD);
            long total = available + onHold + booked + sold;
            stats = new ProjectResponse.UnitStats(total, available, onHold, booked, sold);
        } catch (Exception e) {
            log.warn("Could not fetch unit stats for project {}: {}", project.getId(), e.getMessage());
        }

        return new ProjectResponse(
                project.getId(),
                project.getBuilder().getId(),
                project.getBuilder().getName(),
                project.getName(),
                project.getBuilderDisplayName(),
                project.getProjectType(),
                project.getStatus(),
                project.getAddress(),
                project.getCity(),
                project.getLocality(),
                project.getPincode(),
                project.getLandmark(),
                project.getMapsLink(),
                project.getReraNumber(),
                project.getReraState(),
                project.getReraExpiry(),
                project.getReraPortalUrl(),
                project.getTotalUnits(),
                project.getTowers(),
                project.getFloorsPerTower(),
                project.getPriceMin(),
                project.getPriceMax(),
                project.getPricePerSqftMin(),
                project.getPricePerSqftMax(),
                project.getMaintenance(),
                project.getFloorRise(),
                project.getPossessionDate(),
                project.isClosingSoon(),
                project.isFeatured(),
                project.getVideoUrl(),
                project.getBrochureUrl(),
                project.getCommissionType(),
                project.getCommissionPercent(),
                project.getCpIncentive(),
                project.getAmenities(),
                project.getNearbyHighlights(),
                project.getConfigurations(),
                project.getDescription(),
                stats,
                project.getCreatedAt(),
                project.getUpdatedAt()
        );
    }
}
