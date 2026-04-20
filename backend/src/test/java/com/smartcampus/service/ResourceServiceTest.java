package com.smartcampus.service;

import com.smartcampus.entity.Resource;
import com.smartcampus.entity.Resource.ResourceStatus;
import com.smartcampus.entity.Resource.ResourceType;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.repository.ResourceRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ResourceServiceTest {

    @Mock
    private ResourceRepository resourceRepository;
    @InjectMocks
    private ResourceService resourceService;

    @Test
    void getById_found() {
        Resource r = Resource.builder().id(1L).name("Lab A").build();
        when(resourceRepository.findById(1L)).thenReturn(Optional.of(r));
        assertEquals("Lab A", resourceService.getById(1L).getName());
    }

    @Test
    void getById_notFound() {
        when(resourceRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> resourceService.getById(99L));
    }

    @Test
    void create_savesResource() {
        Resource r = Resource.builder().name("Room B").type(ResourceType.MEETING_ROOM).build();
        when(resourceRepository.save(any())).thenReturn(r);
        Resource saved = resourceService.create(r);
        assertEquals("Room B", saved.getName());
        verify(resourceRepository).save(r);
    }

    @Test
    void delete_setsOutOfService() {
        Resource r = Resource.builder().id(1L).status(ResourceStatus.ACTIVE).build();
        when(resourceRepository.findById(1L)).thenReturn(Optional.of(r));
        when(resourceRepository.save(any())).thenReturn(r);
        resourceService.delete(1L);
        assertEquals(ResourceStatus.OUT_OF_SERVICE, r.getStatus());
    }
}
