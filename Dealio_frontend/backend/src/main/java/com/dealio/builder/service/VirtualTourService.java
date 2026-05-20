package com.dealio.builder.service;

import com.dealio.builder.dto.request.CreateVirtualTourRequest;
import com.dealio.builder.dto.response.VirtualTourResponse;
import com.dealio.builder.entity.Project;
import com.dealio.builder.entity.VirtualTour;
import com.dealio.builder.exception.ResourceNotFoundException;
import com.dealio.builder.repository.VirtualTourRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class VirtualTourService {

    private final VirtualTourRepository virtualTourRepository;
    private final ProjectService projectService;

    @Transactional
    public VirtualTourResponse addTour(CreateVirtualTourRequest request) {
        Project project = projectService.getProjectEntityById(request.projectId());
        VirtualTour tour = VirtualTour.builder()
                .project(project)
                .label(request.label())
                .url(request.url())
                .build();
        VirtualTour saved = virtualTourRepository.save(tour);
        log.info("Added virtual tour with id: {}", saved.getId());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<VirtualTourResponse> getToursByProject(Long projectId) {
        return virtualTourRepository.findByProjectId(projectId).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public void deleteTour(Long id) {
        if (!virtualTourRepository.existsById(id)) {
            throw new ResourceNotFoundException("VirtualTour", "id", id);
        }
        virtualTourRepository.deleteById(id);
        log.info("Deleted virtual tour with id: {}", id);
    }

    private VirtualTourResponse toResponse(VirtualTour tour) {
        return new VirtualTourResponse(
                tour.getId(),
                tour.getProject().getId(),
                tour.getLabel(),
                tour.getUrl(),
                tour.getCreatedAt()
        );
    }
}
