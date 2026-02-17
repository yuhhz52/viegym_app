import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { checkPaymentStatusAPI } from "@/api/paymentApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, Clock } from "lucide-react";
import { toast } from "react-hot-toast";

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "failed" | "pending">("loading");
  const [paymentInfo, setPaymentInfo] = useState<any>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      const orderId = searchParams.get("orderId");

      if (!orderId) {
        setStatus("failed");
        toast.error("Thông tin thanh toán không hợp lệ");
        return;
      }

      try {
        // Check payment status from backend
        const payment = await checkPaymentStatusAPI(orderId);
        setPaymentInfo(payment);

        if (payment.status === "COMPLETED") {
          setStatus("success");
          toast.success("Thanh toán thành công!");
        } else if (payment.status === "FAILED" || payment.status === "CANCELLED") {
          setStatus("failed");
          toast.error("Thanh toán thất bại!");
        } else {
          setStatus("pending");
        }
      } catch (error: any) {
        console.error("Error verifying payment:", error);
        setStatus("failed");
        toast.error("Không thể xác minh trạng thái thanh toán");
      }
    };

    verifyPayment();
  }, [searchParams]);

  const handleBackToBooking = () => {
    navigate("/booking?tab=myBookings");
  };

  const handleRetryPayment = () => {
    navigate("/booking");
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 flex flex-col items-center space-y-4">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
            <p className="text-lg font-medium">Đang xác minh thanh toán...</p>
            <p className="text-sm text-muted-foreground text-center">
              Vui lòng không đóng trang này
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === "success" && (
            <>
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-600">
                Thanh toán thành công!
              </CardTitle>
              <CardDescription>
                Đơn hàng của bạn đã được thanh toán thành công
              </CardDescription>
            </>
          )}

          {status === "failed" && (
            <>
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-12 w-12 text-red-600" />
              </div>
              <CardTitle className="text-2xl text-red-600">
                Thanh toán thất bại!
              </CardTitle>
              <CardDescription>
                Đã có lỗi xảy ra trong quá trình thanh toán
              </CardDescription>
            </>
          )}

          {status === "pending" && (
            <>
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-yellow-100">
                <Clock className="h-12 w-12 text-yellow-600" />
              </div>
              <CardTitle className="text-2xl text-yellow-600">
                Đang xử lý thanh toán
              </CardTitle>
              <CardDescription>
                Giao dịch của bạn đang được xử lý
              </CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {paymentInfo && (
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Mã đơn hàng:</span>
                <span className="font-medium">{paymentInfo.orderId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Số tiền:</span>
                <span className="font-medium">
                  {paymentInfo.amount?.toLocaleString("vi-VN")} VNĐ
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Phương thức:</span>
                <span className="font-medium">{paymentInfo.paymentMethod}</span>
              </div>
              {paymentInfo.transactionId && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Mã giao dịch:</span>
                  <span className="font-medium">{paymentInfo.transactionId}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2">
            {status === "success" && (
              <Button onClick={handleBackToBooking} className="w-full">
                Xem lịch hẹn của tôi
              </Button>
            )}

            {status === "failed" && (
              <>
                <Button onClick={handleRetryPayment} className="w-full">
                  Thử lại thanh toán
                </Button>
                <Button
                  onClick={handleBackToBooking}
                  variant="outline"
                  className="w-full"
                >
                  Về trang đặt lịch
                </Button>
              </>
            )}

            {status === "pending" && (
              <>
                <Button onClick={() => window.location.reload()} className="w-full">
                  Kiểm tra lại
                </Button>
                <Button
                  onClick={handleBackToBooking}
                  variant="outline"
                  className="w-full"
                >
                  Về trang đặt lịch
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
