package com.example.viegymapp.exception;

import lombok.Getter;

@Getter
public class AppException extends RuntimeException {
    private final ErrorCode errorCode;

    public AppException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

    public AppException(String message) {
        super(message);
        this.errorCode = ErrorCode.UNCATEGORIZED_EXCEPTION;
    }

    public AppException(String message, Throwable cause) {
        super(message, cause);
        this.errorCode = ErrorCode.UNCATEGORIZED_EXCEPTION;
    }

    public AppException(Throwable cause) {
        super(cause);
        this.errorCode = ErrorCode.UNCATEGORIZED_EXCEPTION;
    }
}
