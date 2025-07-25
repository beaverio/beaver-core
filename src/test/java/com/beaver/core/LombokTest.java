package com.beaver.core;

import com.beaver.core.user.User;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
public class LombokTest {

    @Test
    public void testLombokGettersAndSetters() {
        // Test that lombok getters and setters are working correctly
        User user = new User();
        
        // Test setters (generated by lombok)
        UUID id = UUID.randomUUID();
        String email = "test@example.com";
        String password = "hashedPassword";
        LocalDateTime now = LocalDateTime.now();
        
        user.setId(id);
        user.setEmail(email);
        user.setPassword(password);
        user.setCreatedAt(now);
        user.setUpdatedAt(now);
        user.setActive(true);
        
        // Test getters (generated by lombok)
        assertThat(user.getId()).isEqualTo(id);
        assertThat(user.getEmail()).isEqualTo(email);
        assertThat(user.getPassword()).isEqualTo(password);
        assertThat(user.getCreatedAt()).isEqualTo(now);
        assertThat(user.getUpdatedAt()).isEqualTo(now);
        assertThat(user.isActive()).isTrue();
    }
}