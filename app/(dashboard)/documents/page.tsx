"use client";
import { useState, useEffect } from "react";
import { FolderOpen, Upload, FileText, Download, Trash2, ExternalLink, ShieldCheck, FileCheck, Loader2 } from "lucide-react";
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

interface DocumentItem {
  id: string;
  name: string;
  url: string;
  type: string;
  size?: number | null;
  createdAt: string;
  product?: { id: string; name: string; sku: string } | null;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/documents");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setDocuments(json.data);
      }
    } catch {
      toast.error("Failed to load export documents.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch("/api/documents", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Document deleted successfully");
        setDocuments((prev) => prev.filter((d) => d.id !== id));
      } else {
        toast.error(json.message || "Failed to delete document");
      }
    } catch {
      toast.error("Network error deleting document");
    }
  };

  return (
    <div className="space-y-8 max-w-[1440px] mx-auto pb-16 font-sans">
      {/* ── Page Header ── */}
      <PageHeader
        title="Documents & Export Certificates"
        subtitle="Wholesale export PDF catalogs, metal alloy certificates, and acoustic frequency spec sheets."
      />

      {/* ── Documents Grid or Empty State ── */}
      {isLoading ? (
        <div className="flex items-center justify-center p-16 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mr-3 text-[#6366F1]" />
          <span>Loading verified documents...</span>
        </div>
      ) : documents.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-white/[0.12] bg-[#0A0D13]">
          <div className="w-12 h-12 rounded-xl bg-[#6366F1]/10 border border-[#6366F1]/20 flex items-center justify-center text-[#818cf8] mx-auto mb-4">
            <FolderOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-[#F8FAFC]">No Documents Uploaded Yet</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mt-1 mb-6">
            Export catalogs, lab purity certificates, and acoustic tuning sheets attached to products or campaigns will be archived here.
          </p>
          <a href="/products">
            <Button variant="outline" size="sm">
              Manage Products & Attachments
            </Button>
          </a>
        </Card>
      ) : (
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
                        {doc.size ? `${(doc.size / (1024 * 1024)).toFixed(1)} MB` : "Document Asset"}
                      </span>
                    </div>
                  </div>
                  {doc.product && (
                    <Badge variant="primary" size="sm">{doc.product.sku}</Badge>
                  )}
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
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300"
                    onClick={() => handleDelete(doc.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                  <a href={doc.url} target="_blank" rel="noreferrer">
                    <Button variant="outline" size="sm" leftIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                      View Asset
                    </Button>
                  </a>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
