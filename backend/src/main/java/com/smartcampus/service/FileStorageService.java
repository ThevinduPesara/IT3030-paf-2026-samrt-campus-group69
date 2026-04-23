package com.smartcampus.service;

import com.smartcampus.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Slf4j
@Service
public class FileStorageService {

    @Value("${app.file.upload-dir}")
    private String uploadDir;

    public String store(MultipartFile file) {
        validateImageFile(file);
        try {
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(uploadPath);

            String extension = getExtension(file.getOriginalFilename());
            String fileName = UUID.randomUUID() + "." + extension;
            Path targetPath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), targetPath);
            return "/uploads/" + fileName;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file: " + e.getMessage());
        }
    }

    private void validateImageFile(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new BadRequestException("Only image files are allowed");
        }
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new BadRequestException("File size must be less than 5MB");
        }
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains("."))
            return "jpg";
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    }
}
