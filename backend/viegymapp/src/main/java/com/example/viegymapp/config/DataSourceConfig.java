package com.example.viegymapp.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;
import java.net.URISyntaxException;

/**
 * Cấu hình DataSource cho Production
 * Tự động chuyển đổi DATABASE_URL từ Render (postgresql://) sang JDBC URL (jdbc:postgresql://)
 */
@Configuration
@ConditionalOnProperty(name = "spring.profiles.active", havingValue = "prod")
public class DataSourceConfig {

    @Value("${DATABASE_URL:}")
    private String databaseUrl;

    @Value("${DB_USERNAME:}")
    private String dbUsername;

    @Value("${DB_PASSWORD:}")
    private String dbPassword;

    @Value("${spring.datasource.hikari.maximum-pool-size:10}")
    private int maximumPoolSize;

    @Value("${spring.datasource.hikari.minimum-idle:2}")
    private int minimumIdle;

    @Value("${spring.datasource.hikari.connection-timeout:20000}")
    private long connectionTimeout;

    @Value("${spring.datasource.hikari.idle-timeout:300000}")
    private long idleTimeout;

    @Value("${spring.datasource.hikari.max-lifetime:1200000}")
    private long maxLifetime;

    @Bean
    @Primary
    public DataSource dataSource() throws URISyntaxException {
        HikariConfig config = new HikariConfig();

        // Chuyển đổi DATABASE_URL từ Render sang JDBC URL
        if (databaseUrl != null && !databaseUrl.isEmpty()) {
            URI dbUri = new URI(databaseUrl);

            String host = dbUri.getHost();
            int port = dbUri.getPort() == -1 ? 5432 : dbUri.getPort();
            String dbName = dbUri.getPath().substring(1);
            String jdbcUrl = String.format("jdbc:postgresql://%s:%d/%s", host, port, dbName);
            config.setJdbcUrl(jdbcUrl);

            // Ưu tiên credentials từ URL, fallback sang DB_USERNAME/DB_PASSWORD
            String userInfo = dbUri.getUserInfo();
            if (userInfo != null && !userInfo.isEmpty()) {
                config.setUsername(userInfo.split(":")[0]);
                config.setPassword(userInfo.contains(":") ? userInfo.split(":", 2)[1] : "");
            } else if (dbUsername != null && !dbUsername.isEmpty()) {
                config.setUsername(dbUsername);
                config.setPassword(dbPassword);
            }
        }

        // Cấu hình HikariCP
        config.setDriverClassName("org.postgresql.Driver");
        config.setMaximumPoolSize(maximumPoolSize);
        config.setMinimumIdle(minimumIdle);
        config.setConnectionTimeout(connectionTimeout);
        config.setIdleTimeout(idleTimeout);
        config.setMaxLifetime(maxLifetime);
        
        // Tối ưu cho PostgreSQL
        config.addDataSourceProperty("cachePrepStmts", "true");
        config.addDataSourceProperty("prepStmtCacheSize", "250");
        config.addDataSourceProperty("prepStmtCacheSqlLimit", "2048");

        return new HikariDataSource(config);
    }
}
