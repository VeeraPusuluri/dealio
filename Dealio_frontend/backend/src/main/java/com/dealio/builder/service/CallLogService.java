package com.dealio.builder.service;

import com.dealio.builder.dto.request.CreateCallLogRequest;
import com.dealio.builder.dto.response.CallLogResponse;
import com.dealio.builder.entity.CallLog;
import com.dealio.builder.entity.Lead;
import com.dealio.builder.exception.ResourceNotFoundException;
import com.dealio.builder.repository.CallLogRepository;
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
public class CallLogService {

    private final CallLogRepository callLogRepository;
    private final LeadRepository leadRepository;

    @Transactional
    public CallLogResponse addCallLog(CreateCallLogRequest request) {
        Lead lead = leadRepository.findById(request.leadId())
                .orElseThrow(() -> new ResourceNotFoundException("Lead", "id", request.leadId()));

        CallLog callLog = CallLog.builder()
                .lead(lead)
                .callerName(request.callerName())
                .outcome(request.outcome())
                .notes(request.notes())
                .build();

        CallLog saved = callLogRepository.save(callLog);
        log.info("Added call log with id: {} for lead: {}", saved.getId(), request.leadId());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<CallLogResponse> getCallLogsByLead(Long leadId) {
        return callLogRepository.findByLeadIdOrderByCreatedAtDesc(leadId).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    private CallLogResponse toResponse(CallLog callLog) {
        return new CallLogResponse(
                callLog.getId(),
                callLog.getLead().getId(),
                callLog.getLead().getCustomerName(),
                callLog.getCallerName(),
                callLog.getOutcome(),
                callLog.getNotes(),
                callLog.getCreatedAt()
        );
    }
}
