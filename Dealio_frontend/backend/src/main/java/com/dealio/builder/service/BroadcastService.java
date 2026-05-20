package com.dealio.builder.service;

import com.dealio.builder.dto.request.CreateBroadcastRequest;
import com.dealio.builder.dto.response.BroadcastResponse;
import com.dealio.builder.entity.Broadcast;
import com.dealio.builder.entity.Project;
import com.dealio.builder.repository.BroadcastRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BroadcastService {

    private final BroadcastRepository broadcastRepository;
    private final BuilderService builderService;
    private final ProjectService projectService;

    @Transactional
    public BroadcastResponse sendBroadcast(CreateBroadcastRequest request) {
        var builder = builderService.getBuilderEntityById(request.builderId());
        Project project = request.projectId() != null
                ? projectService.getProjectEntityById(request.projectId()) : null;

        // Simulate delivery count based on audience
        int delivered = switch (request.audience()) {
            case ALL_CPS -> 100;
            case BY_CITY -> 35;
            case BY_TIER -> 50;
            case BY_PROJECT -> 20;
        };

        Broadcast broadcast = Broadcast.builder()
                .builder(builder)
                .project(project)
                .audience(request.audience())
                .audienceDetail(request.audienceDetail())
                .message(request.message())
                .delivered(delivered)
                .opened(0)
                .build();

        Broadcast saved = broadcastRepository.save(broadcast);
        log.info("Sent broadcast with id: {} to {} recipients", saved.getId(), delivered);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<BroadcastResponse> getBroadcastsByBuilder(Long builderId) {
        return broadcastRepository.findByBuilderIdOrderBySentAtDesc(builderId).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    private BroadcastResponse toResponse(Broadcast broadcast) {
        return new BroadcastResponse(
                broadcast.getId(),
                broadcast.getBuilder().getId(),
                broadcast.getProject() != null ? broadcast.getProject().getId() : null,
                broadcast.getProject() != null ? broadcast.getProject().getName() : null,
                broadcast.getAudience(),
                broadcast.getAudienceDetail(),
                broadcast.getMessage(),
                broadcast.getDelivered(),
                broadcast.getOpened(),
                broadcast.getSentAt()
        );
    }
}
