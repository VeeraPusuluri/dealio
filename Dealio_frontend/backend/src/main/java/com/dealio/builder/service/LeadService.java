package com.dealio.builder.service;

import com.dealio.builder.dto.request.CreateLeadRequest;
import com.dealio.builder.dto.request.UpdateLeadStageRequest;
import com.dealio.builder.dto.response.LeadResponse;
import com.dealio.builder.entity.ChannelPartner;
import com.dealio.builder.entity.Lead;
import com.dealio.builder.entity.Project;
import com.dealio.builder.enums.LeadSource;
import com.dealio.builder.enums.LeadStage;
import com.dealio.builder.exception.ResourceNotFoundException;
import com.dealio.builder.repository.ChannelPartnerRepository;
import com.dealio.builder.repository.LeadRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class LeadService {

    private final LeadRepository leadRepository;
    private final ProjectService projectService;
    private final BuilderService builderService;
    private final ChannelPartnerRepository channelPartnerRepository;

    @Transactional
    public LeadResponse createLead(CreateLeadRequest request) {
        Project project = request.projectId() != null
                ? projectService.getProjectEntityById(request.projectId()) : null;
        var builder = builderService.getBuilderEntityById(request.builderId());
        ChannelPartner cp = request.channelPartnerId() != null
                ? channelPartnerRepository.findById(request.channelPartnerId())
                    .orElseThrow(() -> new ResourceNotFoundException("ChannelPartner", "id", request.channelPartnerId()))
                : null;

        LeadStage stage = request.stage() != null ? request.stage() : LeadStage.NEW_LEAD;
        int score = calculateLeadScore(stage);

        Lead lead = Lead.builder()
                .project(project)
                .builder(builder)
                .channelPartner(cp)
                .customerName(request.customerName())
                .customerPhone(request.customerPhone())
                .customerEmail(request.customerEmail())
                .budget(request.budget())
                .stage(stage)
                .source(request.source() != null ? request.source() : LeadSource.OTHER)
                .unitType(request.unitType())
                .score(score)
                .daysInStage(0)
                .build();

        Lead saved = leadRepository.save(lead);
        log.info("Created lead with id: {}", saved.getId());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<LeadResponse> getLeadsByBuilder(Long builderId, Long projectId, LeadStage stage,
                                                 LeadSource source, String scoreFilter) {
        List<Lead> leads = leadRepository.findByBuilderIdWithFilters(builderId, projectId, stage, source);
        return leads.stream()
                .filter(l -> scoreFilter == null || getLeadHeat(l.getScore()).equalsIgnoreCase(scoreFilter))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LeadResponse> getLeadsByProject(Long projectId) {
        return leadRepository.findByProjectId(projectId).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public LeadResponse updateLeadStage(Long id, UpdateLeadStageRequest request) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lead", "id", id));
        lead.setStage(request.stage());
        lead.setScore(calculateLeadScore(request.stage()));
        lead.setDaysInStage(0);
        Lead saved = leadRepository.save(lead);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<LeadResponse> exportLeads(Long builderId) {
        return leadRepository.findByBuilderId(builderId).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    public int calculateLeadScore(LeadStage stage) {
        return switch (stage) {
            case NEW_LEAD -> 10;
            case MEETING_REQUESTED -> 20;
            case MEETING_CONFIRMED -> 35;
            case MEETING_DONE -> 50;
            case NEGOTIATION -> 65;
            case BOOKED -> 85;
            case CLOSED -> 100;
        };
    }

    public String getLeadHeat(int score) {
        if (score >= 70) return "HOT";
        if (score >= 40) return "WARM";
        return "COLD";
    }

    private LeadResponse toResponse(Lead lead) {
        return new LeadResponse(
                lead.getId(),
                lead.getProject() != null ? lead.getProject().getId() : null,
                lead.getProject() != null ? lead.getProject().getName() : null,
                lead.getBuilder().getId(),
                lead.getChannelPartner() != null ? lead.getChannelPartner().getId() : null,
                lead.getChannelPartner() != null ? lead.getChannelPartner().getName() : null,
                lead.getCustomerName(),
                lead.getCustomerPhone(),
                lead.getCustomerEmail(),
                lead.getBudget(),
                lead.getStage(),
                lead.getSource(),
                lead.getUnitType(),
                lead.getScore(),
                getLeadHeat(lead.getScore()),
                lead.getDaysInStage(),
                lead.getNotes(),
                lead.getCreatedAt(),
                lead.getUpdatedAt()
        );
    }
}
