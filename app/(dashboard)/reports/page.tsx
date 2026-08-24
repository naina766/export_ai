"use client";
import { useState } from "react";
import { FileSpreadsheet, Download, FileText, CheckCircle2, Table as TableIcon, Layers } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Badge,
  PageHeader,
} from "@/components/ui";
import toast from "react-hot-toast";

export default function ReportsPage() {
  const handleExportCsv = () => {
    toast.success("Exporting verified buyer leads CSV...");
    window.location.href = "/api/leads?limit=500";
  };

  return (
    <div className="space-y-8 max-w-[1440px] mx-auto pb-16 font-sans">
      {/* ── Page Header ── */}
      <PageHeader
        title="Export Intelligence Reports"
        subtitle="Generate CSV audits, campaign deliverability datasets, and buyer engagement summaries."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <div>
              <CardTitle>Buyer Leads Directory Audit</CardTitle>
              <CardDescription>Full CSV export of discovered international buyers and AI scores</CardDescription>
            </div>
            <Badge variant="success" size="sm">CSV Format</Badge>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300 leading-relaxed">
            <p>
              Includes company name, procurement contact, email verification status, country code, AI lead score, intent clustering, and last contact timestamp.
            </p>
          </CardContent>
          <CardFooter>
            <Button
              variant="primary"
              size="md"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={handleExportCsv}
            >
              Download Buyer Leads (CSV)
            </Button>
          </CardFooter>
        </Card>

        <Card className="flex flex-col justify-between">
          <CardHeader>
            <div>
              <CardTitle>Campaign Deliverability & Reply Log</CardTitle>
              <CardDescription>Detailed message dispatch and response analytics</CardDescription>
            </div>
            <Badge variant="primary" size="sm">CSV Dataset</Badge>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300 leading-relaxed">
            <p>
              Contains delivery timestamps, recipient address, Gmail message thread IDs, open timestamps, bounce categories, and conversion milestones.
            </p>
          </CardContent>
          <CardFooter>
            <Button
              variant="secondary"
              size="md"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={() => toast.success("Generating delivery audit dataset...")}
            >
              Export Deliverability Report
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
