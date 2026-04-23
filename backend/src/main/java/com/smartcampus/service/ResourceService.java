package com.smartcampus.service;

import com.smartcampus.entity.Resource;
import com.smartcampus.entity.Resource.ResourceStatus;
import com.smartcampus.entity.Resource.ResourceType;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.repository.ResourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ResourceService {

    private final ResourceRepository resourceRepository;

    public List<Resource> searchResources(ResourceType type, ResourceStatus status,
            String location, Integer minCapacity) {
        return resourceRepository.searchResources(type, status, location, minCapacity);
    }

    public Resource getById(Long id) {
        return resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with id: " + id));
    }

    @Transactional
    public Resource create(Resource resource) {
        return resourceRepository.save(resource);
    }

    @Transactional
    public Resource update(Long id, Resource updates) {
        Resource existing = getById(id);
        existing.setName(updates.getName());
        existing.setType(updates.getType());
        existing.setCapacity(updates.getCapacity());
        existing.setLocation(updates.getLocation());
        existing.setDescription(updates.getDescription());
        existing.setStatus(updates.getStatus());
        existing.setAvailabilityStart(updates.getAvailabilityStart());
        existing.setAvailabilityEnd(updates.getAvailabilityEnd());
        return resourceRepository.save(existing);
    }