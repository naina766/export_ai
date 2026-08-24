"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PackagePlus, ArrowLeft, Save, Sparkles, CheckCircle2 } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Input,
  Select,
  Textarea,
  PageHeader,
} from "@/components/ui";
import toast from "react-hot-toast";

export default function NewProductPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("TIBETAN_HAND_HAMMERED");
  const [material, setMaterial] = useState("7-Metal Bronze Alloy");
  const [frequency, setFrequency] = useState("432 Hz / F Note (Heart Chakra)");
  const [diameter, setDiameter] = useState("8-10 inches (20-25 cm)");
  const [priceMin, setPriceMin] = useState(65);
  const [priceMax, setPriceMax] = useState(95);
  const [moq, setMoq] = useState(10);
  const [stockQuantity, setStockQuantity] = useState(100);
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("https://images.unsplash.com/photo-1514533450685-4493e01d1fdc?auto=format&fit=crop&w=800&q=80");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sku || !priceMin) {
      toast.error("Please fill in required product fields.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          sku,
          category,
          material,
          frequency,
          diameter,
          priceMin: Number(priceMin),
          priceMax: Number(priceMax) || undefined,
          moq: Number(moq),
          stockQuantity: Number(stockQuantity),
          description,
          thumbnailUrl,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success("Singing bowl product added to export catalog!");
        router.push("/products");
      } else {
        toast.error(json.message || "Failed to add product");
      }
    } catch {
      toast.error("Network error adding product");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* ── Page Header ── */}
      <PageHeader
        title="Add Export Product"
        subtitle="Add handcrafted singing bowls, chakra sets, or temple gongs to the wholesale export catalog."
        actions={
          <Link href="/products">
            <Button variant="outline" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Catalog
            </Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>General Product Information</CardTitle>
              <CardDescription>Primary identification, category and SKU tracking</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Product Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Master Hand-Hammered Singing Bowl"
                required
              />
              <Input
                label="Export SKU Code"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. SB-THH-002"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Product Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                options={[
                  { value: "TIBETAN_HAND_HAMMERED", label: "Tibetan Hand-Hammered Bowl" },
                  { value: "CHAKRA_SET_7", label: "7-Chakra Tuned Harmonic Set" },
                  { value: "FULL_MOON_BOWL", label: "Full Moon Energized Singing Bowl" },
                  { value: "CRYSTAL_QUARTZ", label: "Frosted Crystal Quartz Bowl" },
                  { value: "TEMPLE_GONG", label: "Himalayan Temple Gong" },
                  { value: "ACCESSORIES", label: "Mallets, Cushions & Strikers" },
                ]}
              />
              <Input
                label="Image URL"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <Textarea
              label="Product Description (Export Specifications)"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail alloy composition, sound sustain duration, harmonic overtones, and included accessories..."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Acoustic & Material Specifications</CardTitle>
              <CardDescription>Frequency tuning, alloy formula, and dimensions</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Material Composition"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder="e.g. 7-Metal Bronze Alloy"
              />
              <Input
                label="Frequency Tuning"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                placeholder="e.g. 432 Hz / F Note"
              />
              <Input
                label="Diameter / Dimensions"
                value={diameter}
                onChange={(e) => setDiameter(e.target.value)}
                placeholder="e.g. 10-12 inches"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Wholesale & Export Pricing (FOB)</CardTitle>
              <CardDescription>Tiered unit pricing and minimum order quantities</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <Input
                label="Min FOB Price ($)"
                type="number"
                value={priceMin}
                onChange={(e) => setPriceMin(Number(e.target.value))}
                required
              />
              <Input
                label="Max FOB Price ($)"
                type="number"
                value={priceMax}
                onChange={(e) => setPriceMax(Number(e.target.value))}
              />
              <Input
                label="Wholesale MOQ (Units)"
                type="number"
                value={moq}
                onChange={(e) => setMoq(Number(e.target.value))}
                required
              />
              <Input
                label="Available Stock"
                type="number"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(Number(e.target.value))}
              />
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-between">
            <Link href="/products">
              <Button variant="ghost" size="md">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Product to Catalog
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
