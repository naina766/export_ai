"use client";
import { useState } from "react";
import { FolderOpen, Upload, FileText, Download, Trash2, ExternalLink, ShieldCheck, FileCheck } from "lucide-react";
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

interface DocumentItem {
  id: string;
  name: string;
  url: string;
  type: string;
  size?: number | null;
  createdAt: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([
    {
      id: "doc_1",
      name: "Himalayan_Singing_Bowls_Export_Wholesale_Catalog_2026.pdf",
      url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      type: "PRODUCT_CATALOG",
      size: 4500000,
      createdAt: new Date().toISOString(),
    },
    {
      id: "doc_2",
      name: "7_Metal_Alloy_Purity_Lab_Certificate_Intertek.pdf",
      url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      type: "LAB_REPORT",
      size: 1200000,
      createdAt: new Date().toISOString(),
    },
    {
      id: "doc_3",
      name: "432Hz_Chakra_Acoustic_Tuning_Specification_Sheet.pdf",
      url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      type: "SPECIFICATION_SHEET",
      size: 850000,
      createdAt: new Date().toISOString(),
    },
  ]);

  return (
    <div className="space-y-8 max-w-[1440px] mx-auto pb-16 font-sans">
      {/* ── Page Header ── */}
      <PageHeader
        title="Documents & Export Certificates"
        subtitle="Wholesale export PDF catalogs, metal alloy certificates, and acoustic frequency spec sheets."
      />

      {/* ── Documents Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {documents.map((doc) => (
          <Card key={doc.id} className="flex flex-col justify-between hover:border-white/[0.2] transition-colors">
            <div>
              <CardHeader>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-[#6366F1]/10 border border-[#6366F1]/20 flex items-center justify-center text-[#818cf8]">
                    <FileText className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">{doc.type.replace(/_/g, " ")}</CardTitle>
                    <span className="text-xs font-mono text-slate-400">
                      {doc.size ? `${(doc.size / (1024 * 1024)).toFixed(1)} MB` : "PDF Document"}
                    </span>
                  </div>
                </div>
                <Badge variant="primary" size="sm">Verified</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-xs font-mono text-[#F8FAFC] break-all p-3.5 rounded-lg bg-[#0A0D13] border border-white/[0.06] leading-relaxed">
                  {doc.name}
                </p>
              </CardContent>
            </div>
            <CardFooter className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">
                {new Date(doc.createdAt).toLocaleDateString()}
              </span>
              <a href={doc.url} target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm" leftIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                  View Asset
                </Button>
              </a>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
