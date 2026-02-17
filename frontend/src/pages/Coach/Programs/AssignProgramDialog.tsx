import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { getActiveClientsAPI, assignProgramToClientAPI, type ClientResponse } from "@/api/coachApi";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AssignProgramDialogProps {
  open: boolean;
  onClose: () => void;
  programId: string;
  programName: string;
}

export function AssignProgramDialog({ open, onClose, programId, programName }: AssignProgramDialogProps) {
  const [clients, setClients] = useState<ClientResponse[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchClients();
    }
  }, [open]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const data = await getActiveClientsAPI();
      setClients(data);
    } catch (error) {
      console.error("Failed to load clients:", error);
      toast.error("Không thể tải danh sách học viên");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedClientId) {
      toast.error("Vui lòng chọn học viên");
      return;
    }

    setSubmitting(true);
    try {
      await assignProgramToClientAPI({
        clientId: selectedClientId,
        programId,
        notes,
      });
      toast.success("Đã gán chương trình thành công");
      onClose();
      // Reset form
      setSelectedClientId("");
      setNotes("");
    } catch (error: any) {
      console.error("Failed to assign program:", error);
      const errorMessage = error?.response?.data?.message || "Không thể gán chương trình";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gán chương trình cho học viên</DialogTitle>
          <DialogDescription>
            Chọn học viên để gán chương trình <strong>{programName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="client">Học viên *</Label>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger id="client">
                  <SelectValue placeholder="Chọn học viên" />
                </SelectTrigger>
                <SelectContent>
                  {clients.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      Chưa có học viên nào
                    </div>
                  ) : (
                    clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        <div className="flex items-center gap-2">
                          <span>{client.fullName}</span>
                          <span className="text-xs text-gray-500">({client.email})</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Ghi chú</Label>
            <Textarea
              id="notes"
              placeholder="Thêm ghi chú cho học viên..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !selectedClientId}>
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang gán...
              </>
            ) : (
              "Gán chương trình"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
