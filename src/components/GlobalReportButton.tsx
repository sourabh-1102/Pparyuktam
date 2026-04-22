"use client";

import { useState } from "react";
import ReportModal from "./ReportModal";

export default function GlobalReportButton() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button 
                onClick={() => setIsOpen(true)}
                className="text-red-500 hover:text-red-700 font-medium transition-colors inline-flex items-center gap-2 mt-4"
            >
                🚨 Report Issue
            </button>
            <ReportModal 
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                entityType="general"
            />
        </>
    );
}
