package com.dealio.builder.service;

import com.dealio.builder.dto.request.CreateMeetingRequest;
import com.dealio.builder.dto.request.UpdateMeetingRequest;
import com.dealio.builder.dto.response.MeetingResponse;
import com.dealio.builder.entity.ChannelPartner;
import com.dealio.builder.entity.Meeting;
import com.dealio.builder.entity.Project;
import com.dealio.builder.enums.MeetingStatus;
import com.dealio.builder.exception.ResourceNotFoundException;
import com.dealio.builder.repository.ChannelPartnerRepository;
import com.dealio.builder.repository.MeetingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MeetingService {

    private final MeetingRepository meetingRepository;
    private final ProjectService projectService;
    private final BuilderService builderService;
    private final ChannelPartnerRepository channelPartnerRepository;

    @Transactional
    public MeetingResponse createMeeting(CreateMeetingRequest request) {
        Project project = request.projectId() != null
                ? projectService.getProjectEntityById(request.projectId()) : null;
        var builder = builderService.getBuilderEntityById(request.builderId());
        ChannelPartner cp = request.channelPartnerId() != null
                ? channelPartnerRepository.findById(request.channelPartnerId())
                    .orElseThrow(() -> new ResourceNotFoundException("ChannelPartner", "id", request.channelPartnerId()))
                : null;

        Meeting meeting = Meeting.builder()
                .project(project)
                .builder(builder)
                .channelPartner(cp)
                .customerName(request.customerName())
                .customerPhone(request.customerPhone())
                .cpName(cp != null ? cp.getName() : null)
                .preferredDate(request.preferredDate())
                .preferredTime(request.preferredTime())
                .status(MeetingStatus.PENDING)
                .notes(request.notes())
                .build();

        Meeting saved = meetingRepository.save(meeting);
        log.info("Created meeting with id: {}", saved.getId());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<MeetingResponse> getMeetingsByBuilder(Long builderId, MeetingStatus status) {
        return meetingRepository.findByBuilderIdWithStatus(builderId, status)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public MeetingResponse updateMeeting(Long id, UpdateMeetingRequest request) {
        Meeting meeting = meetingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting", "id", id));
        if (request.status() != null) meeting.setStatus(request.status());
        if (request.confirmedDate() != null) meeting.setConfirmedDate(request.confirmedDate());
        if (request.confirmedTime() != null) meeting.setConfirmedTime(request.confirmedTime());
        if (request.builderNotes() != null) meeting.setBuilderNotes(request.builderNotes());
        Meeting saved = meetingRepository.save(meeting);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public long countPending(Long builderId) {
        return meetingRepository.countByBuilderIdAndStatus(builderId, MeetingStatus.PENDING);
    }

    private MeetingResponse toResponse(Meeting meeting) {
        return new MeetingResponse(
                meeting.getId(),
                meeting.getProject() != null ? meeting.getProject().getId() : null,
                meeting.getProject() != null ? meeting.getProject().getName() : null,
                meeting.getBuilder().getId(),
                meeting.getChannelPartner() != null ? meeting.getChannelPartner().getId() : null,
                meeting.getChannelPartner() != null ? meeting.getChannelPartner().getName() : null,
                meeting.getCustomerName(),
                meeting.getCustomerPhone(),
                meeting.getCpName(),
                meeting.getPreferredDate(),
                meeting.getPreferredTime(),
                meeting.getConfirmedDate(),
                meeting.getConfirmedTime(),
                meeting.getStatus(),
                meeting.getNotes(),
                meeting.getBuilderNotes(),
                meeting.getCreatedAt(),
                meeting.getUpdatedAt()
        );
    }
}
