import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { createVNPayPaymentAPI } from "@/api/paymentApi";
import type { CreatePaymentRequest } from "@/api/paymentApi";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingSessionId: string; // Required: booking must be created before payment
  amount: number;
  description?: string;
  onPaymentSuccess?: () => void;
}

export default function PaymentDialog({
  open,
  onOpenChange,
  bookingSessionId,
  amount,
  description,
}: PaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<"VNPAY" | "ZALOPAY">("VNPAY");
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    if (!bookingSessionId) {
      toast.error("Không tìm thấy thông tin đặt lịch. Vui lòng thử lại!");
      return;
    }

    setIsProcessing(true);
    try {
      // Payment for existing PENDING booking
      const request: CreatePaymentRequest = {
        bookingSessionId: bookingSessionId,
        amount,
        paymentMethod,
        description: description || `Thanh toán đặt lịch tập`,
        returnUrl: `${window.location.origin}/payment/callback`,
      };
      
      console.log("Payment request for booking:", JSON.stringify(request, null, 2));
      const response = await createVNPayPaymentAPI(request);

      if (response.payUrl) {
        // Redirect to payment gateway
        window.location.href = response.payUrl;
      } else {
        toast.error("Không thể tạo link thanh toán. Vui lòng thử lại!");
        setIsProcessing(false);
      }
    } catch (error: any) {
      console.error("Payment creation error:", error);
      console.error("Error response data:", error.response?.data);
      console.error("Error response status:", error.response?.status);
      toast.error(error?.response?.data?.message || "Có lỗi xảy ra khi tạo thanh toán");
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Chọn phương thức thanh toán</DialogTitle>
          <DialogDescription>
            Vui lòng chọn phương thức thanh toán để hoàn tất đặt lịch
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-base font-semibold">
              Số tiền: {amount?.toLocaleString("vi-VN")} VNĐ
            </Label>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Chọn phương thức:</Label>
            <RadioGroup
              value={paymentMethod}
              onValueChange={(value: any) => setPaymentMethod(value)}
            >
              <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                <RadioGroupItem value="VNPAY" id="vnpay" />
                <Label
                  htmlFor="vnpay"
                  className="flex items-center gap-3 cursor-pointer flex-1"
                >
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                    VN
                  </div>
                  <div>
                    <div className="font-semibold">VNPay</div>
                    <div className="text-xs text-muted-foreground">
                      Thanh toán qua cổng VNPay
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent opacity-50">
                <RadioGroupItem value="ZALOPAY" id="zalopay" disabled />
                <Label
                  htmlFor="zalopay"
                  className="flex items-center gap-3 cursor-pointer flex-1"
                >
                  <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center text-white font-bold">
                    Z
                  </div>
                  <div>
                    <div className="font-semibold">ZaloPay</div>
                    <div className="text-xs text-muted-foreground">
                      Đang phát triển
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="text-xs text-muted-foreground mt-4">
            Bạn sẽ được chuyển đến trang thanh toán của {paymentMethod} để hoàn tất
            giao dịch.
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Hủy
          </Button>
          <Button onClick={handlePayment} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              "Thanh toán"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
