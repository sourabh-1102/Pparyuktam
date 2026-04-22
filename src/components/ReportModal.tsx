"use client";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Flag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: "project" | "user" | "team" | "general";
  entityId?: string;
  entityName?: string;
}

export default function ReportModal({ isOpen, onClose, entityType, entityId, entityName }: ReportModalProps) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleReport = async () => {
    if (!reason || !description) {
      toast({ title: "Error", description: "Please provide a reason and description.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/reports/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reported_entity_type: entityType,
          reported_entity_id: entityId || null,
          reason,
          description,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit report");
      }

      toast({ title: "Report Submitted", description: "Your report has been submitted to moderation." });
      setReason("");
      setDescription("");
      onClose();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getReasonOptions = () => {
    if (entityType === "general") {
       return ["Bug", "Payment Issue", "Abuse", "Other"];
    }
    return ["Spam", "Abuse", "Fake Project", "Other"];
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Flag className="w-5 h-5" /> Report {entityType.charAt(0).toUpperCase() + entityType.slice(1)}
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to report {entityName ? `"${entityName}"` : "this"}? Please provide details below. Our moderation team will review this shortly.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a violation reason" />
              </SelectTrigger>
              <SelectContent>
                {getReasonOptions().map(opt => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Provide more context about the violation..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button variant="destructive" onClick={handleReport} disabled={isSubmitting || !reason || !description}>
            {isSubmitting ? "Submitting..." : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
