package com.example.viegymapp.service;

import com.example.viegymapp.config.RabbitMQConfig;
import com.example.viegymapp.dto.message.EmailMessage;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailConsumerService {
    
    @Autowired(required = false)
    private JavaMailSender mailSender;
    
    @Value("${spring.mail.username:noreply@viegym.com}")
    private String fromEmail;
    
    @Value("${viegym.app.frontendUrl:http://localhost:5173}")
    private String frontendUrl;
    
    /**
     * Normalize and clean frontend URL
     * Handles URL encoding issues and ensures proper format
     */
    private String normalizeFrontendUrl(String url) {
        if (url == null || url.trim().isEmpty()) {
            log.warn("Frontend URL is null or empty, using default: http://localhost:5173");
            return "http://localhost:5173";
        }
        
        String cleaned = url.trim();
        
        // Chỉ decode nếu URL có vẻ đã bị encode (chứa % và không phải là URL hợp lệ)
        try {
            if (cleaned.contains("%") && !cleaned.contains("://")) {
                // Có thể là URL đã bị encode hoàn toàn
                String decoded = java.net.URLDecoder.decode(cleaned, java.nio.charset.StandardCharsets.UTF_8);
                log.info("Decoded frontend URL from: {} to: {}", cleaned, decoded);
                cleaned = decoded;
            } else if (cleaned.contains("%") && cleaned.contains("://")) {
                // URL có protocol nhưng có thể có phần bị encode
                if (cleaned.matches(".*%[0-9A-Fa-f]{2}.*") && !cleaned.matches("https?://[^%]+")) {
                    String decoded = java.net.URLDecoder.decode(cleaned, java.nio.charset.StandardCharsets.UTF_8);
                    log.info("Decoded frontend URL (with protocol) from: {} to: {}", cleaned, decoded);
                    cleaned = decoded;
                }
            }
        } catch (Exception e) {
            log.warn("Failed to decode URL, using original: {} - Error: {}", cleaned, e.getMessage());
        }
        
        // Loại bỏ trailing slash
        if (cleaned.endsWith("/")) {
            cleaned = cleaned.substring(0, cleaned.length() - 1);
        }
        
        // Validate URL format
        if (!cleaned.startsWith("http://") && !cleaned.startsWith("https://")) {
            log.warn("Frontend URL does not start with http:// or https://, adding http://");
            cleaned = "http://" + cleaned;
        }
        
        return cleaned;
    }
    
    @RabbitListener(queues = RabbitMQConfig.EMAIL_QUEUE)
    public void processEmailMessage(EmailMessage emailMessage) {
        log.info("Received email message from queue - Type: {}, To: {}", 
                emailMessage.getEmailType(), emailMessage.getToEmail());
        
        try {
            switch (emailMessage.getEmailType()) {
                case PASSWORD_RESET:
                    log.info("Processing PASSWORD_RESET email for: {}", emailMessage.getToEmail());
                    sendPasswordResetEmail(emailMessage);
                    break;
                case WELCOME:
                    log.info("WELCOME email type not yet implemented");
                    break;
                case NOTIFICATION:
                    log.info("NOTIFICATION email type not yet implemented");
                    break;
            }
            log.info("Email sent successfully to: {}", emailMessage.getToEmail());
        } catch (Exception e) {
            log.error("Failed to send email to: {} - Error: {}", 
                    emailMessage.getToEmail(), e.getMessage(), e);
            throw new RuntimeException("Email sending failed", e); // Will go to DLQ
        }
    }
    
    private void sendPasswordResetEmail(EmailMessage emailMessage) throws MessagingException {
        log.info("Building password reset email - From: {}, To: {}", fromEmail, emailMessage.getToEmail());
        
        if (mailSender == null) {
            log.warn("JavaMailSender is not configured. Email sending is disabled.");
            return;
        }
        
        // Normalize frontend URL để xử lý cả local và production
        String cleanFrontendUrl = normalizeFrontendUrl(frontendUrl);
        
        log.info("Frontend URL (normalized): {}", cleanFrontendUrl);
        
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        
        helper.setFrom(fromEmail);
        helper.setTo(emailMessage.getToEmail());
        helper.setSubject(emailMessage.getSubject());
        
        // UUID token không chứa ký tự đặc biệt, nhưng encode để an toàn
        // Chỉ encode token, không encode toàn bộ URL
        String encodedToken = java.net.URLEncoder.encode(emailMessage.getResetToken(), java.nio.charset.StandardCharsets.UTF_8);
        String resetLink = cleanFrontendUrl + "/auth/reset-password?token=" + encodedToken;
        log.info("Reset link generated: {}", resetLink);
        
        String htmlContent = buildPasswordResetEmailTemplate(resetLink);
        helper.setText(htmlContent, true);
        
        log.info("Sending email via JavaMailSender...");
        mailSender.send(message);
        log.info("Email sent successfully via JavaMailSender");
    }
    
    private String buildPasswordResetEmailTemplate(String resetLink) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    .container {
                        background-color: #f9f9f9;
                        border-radius: 10px;
                        padding: 30px;
                        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 30px;
                    }
                    .logo {
                        font-size: 32px;
                        font-weight: bold;
                        color: #F97316;
                        margin-bottom: 10px;
                    }
                    .content {
                        background-color: white;
                        padding: 25px;
                        border-radius: 8px;
                        margin-bottom: 20px;
                    }
                    .button {
                        display: inline-block;
                        padding: 14px 32px;
                        background-color: #F97316;
                        color: white !important;
                        text-decoration: none;
                        border-radius: 8px;
                        font-weight: bold;
                        margin: 20px 0;
                        text-align: center;
                    }
                    .button:hover {
                        background-color: #EA580C;
                    }
                    .warning {
                        background-color: #FEF3C7;
                        border-left: 4px solid #F59E0B;
                        padding: 15px;
                        margin: 20px 0;
                        border-radius: 4px;
                    }
                    .footer {
                        text-align: center;
                        color: #666;
                        font-size: 12px;
                        margin-top: 30px;
                        padding-top: 20px;
                        border-top: 1px solid #ddd;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">VieGym</div>
                        <h2 style="color: #333; margin: 0;">Đặt lại mật khẩu</h2>
                    </div>
                    
                    <div class="content">
                        <p>Xin chào,</p>
                        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản VieGym của bạn.</p>
                        <p>Nhấp vào nút bên dưới để đặt lại mật khẩu:</p>
                        
                        <div style="text-align: center;">
                            <a href="%s" class="button">Đặt lại mật khẩu</a>
                        </div>
                        
                        <div class="warning">
                            <strong>Lưu ý:</strong>
                            <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                                <li>Link này chỉ có hiệu lực trong <strong>1 giờ</strong></li>
                                <li>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này</li>
                            </ul>
                        </div>
                        
                        <p style="color: #666; font-size: 14px; margin-top: 20px;">
                            Hoặc copy link sau vào trình duyệt:<br>
                            <code style="background: #f5f5f5; padding: 8px; display: block; margin-top: 8px; word-break: break-all;">%s</code>
                        </p>
                    </div>
                    
                    <div class="footer">
                        <p>Email này được gửi tự động, vui lòng không trả lời.</p>
                        <p>&copy; 2025 VieGym. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(resetLink, resetLink);
    }
}
