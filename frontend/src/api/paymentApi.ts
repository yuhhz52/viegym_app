import apiClient from "./apiClient";

export interface CreatePaymentRequest {
  bookingSessionId: string;
  amount: number;
  paymentMethod: "VNPAY" | "ZALOPAY" | "BANK_TRANSFER" | "CASH";
  description?: string;
  returnUrl?: string;
  notifyUrl?: string;
}


export interface PaymentResponse {
  id: string;
  bookingSessionId: string;
  amount: number;
  paymentMethod: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "REFUNDED" | "CANCELLED";
  orderId: string;
  transactionId?: string;
  description: string;
  paidAt?: string;
  createdAt: string;
  payUrl?: string;
  qrCodeUrl?: string;
  deeplink?: string;
}

export const createVNPayPaymentAPI = async (
  request: CreatePaymentRequest
): Promise<PaymentResponse> => {
  console.log("[paymentApi] Calling createVNPayPayment with:", request);
  try {
    const response = await apiClient.post<{code: number; message: string; result: PaymentResponse}>(
      "/api/v1/payments/vnpay/create",
      request
    );
    console.log("[paymentApi] Success response:", response.data);
    return response.data.result;
  } catch (error) {
    console.error("[paymentApi] Error:", error);
    throw error;
  }
};


export const checkPaymentStatusAPI = async (
  orderId: string
): Promise<PaymentResponse> => {
  const response = await apiClient.get<{code: number; message: string; result: PaymentResponse}>(
    `/api/v1/payments/status/${orderId}`
  );
  return response.data.result;
};

export const getPaymentByBookingAPI = async (
  bookingSessionId: string
): Promise<PaymentResponse> => {
  const response = await apiClient.get<{code: number; message: string; result: PaymentResponse}>(
    `/api/v1/payments/booking/${bookingSessionId}`
  );
  return response.data.result;
};

export const getMyPaymentsAPI = async (): Promise<PaymentResponse[]> => {
  const response = await apiClient.get<{code: number; message: string; result: PaymentResponse[]}>(
    "/api/v1/payments/my-payments"
  );
  return response.data.result;
};

export const refundPaymentAPI = async (
  paymentId: string,
  reason?: string
): Promise<PaymentResponse> => {
  const response = await apiClient.post<{code: number; message: string; result: PaymentResponse}>(
    `/api/v1/payments/${paymentId}/refund`,
    null,
    { params: { reason } }
  );
  return response.data.result;
};
