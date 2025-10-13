"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Save,
  Settings,
  FileText,
  Layout,
  Star,
} from "lucide-react";
import Link from "next/link";

interface ContentSection {
  id?: string;
  type: string;
  title?: string;
  subtitle?: string;
  content?: any;
  imageUrl?: string;
  buttonText?: string;
  buttonLink?: string;
  order: number;
  isVisible?: boolean;
}

interface ContentPage {
  id?: string;
  slug: string;
  title: string;
  type: string;
  isActive?: boolean;
  sections: ContentSection[];
  createdAt?: string;
  updatedAt?: string;
}

interface SiteSettings {
  siteName: string;
  siteDescription: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  heroVideoUrl?: string;
  contactEmail: string;
  socialInstagram?: string;
  socialTiktok?: string;
  freeShippingThreshold: number;
}

export default function CMSManagement() {
  const [pages, setPages] = useState<ContentPage[]>([]);
  const [settings, setSettings] = useState<SiteSettings>({
    siteName: "",
    siteDescription: "",
    primaryColor: "#000000",
    secondaryColor: "#ffffff",
    logoUrl: "",
    contactEmail: "",
    freeShippingThreshold: 50,
  });
  const [loading, setLoading] = useState(true);
  const [editingPage, setEditingPage] = useState<ContentPage | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { push } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pagesRes, settingsRes] = await Promise.all([
        fetch("/api/admin/cms/pages"),
        fetch("/api/admin/cms/settings"),
      ]);

      if (pagesRes.ok) {
        const pagesData = await pagesRes.json();
        setPages(pagesData.pages || []);
      }

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData.settings || {});
      }
    } catch (error) {
      console.error("Error loading CMS data:", error);
      push({
        message: "Failed to load CMS data",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const savePage = async (page: ContentPage) => {
    try {
      const response = await fetch("/api/admin/cms/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(page),
      });

      if (response.ok) {
        const data = await response.json();
        setPages((prev) => {
          const index = prev.findIndex((p) => p.id === page.id);
          if (index >= 0) {
            return prev.map((p, i) => (i === index ? data.page : p));
          }
          return [...prev, data.page];
        });

        push({
          message: "Page saved successfully",
          type: "success",
        });

        setIsDialogOpen(false);
        setEditingPage(null);
      } else {
        throw new Error("Failed to save page");
      }
    } catch (error) {
      console.error("Error saving page:", error);
      push({
        message: "Failed to save page",
        type: "error",
      });
    }
  };

  const deletePage = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/cms/pages?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setPages((prev) => prev.filter((p) => p.id !== id));
        push({
          message: "Page deleted successfully",
          type: "success",
        });
      } else {
        throw new Error("Failed to delete page");
      }
    } catch (error) {
      console.error("Error deleting page:", error);
      push({
        message: "Failed to delete page",
        type: "error",
      });
    }
  };

  const saveSettings = async () => {
    try {
      const response = await fetch("/api/admin/cms/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });

      if (response.ok) {
        push({
          message: "Settings saved successfully",
          type: "success",
        });
      } else {
        throw new Error("Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      push({
        message: "Failed to save settings",
        type: "error",
      });
    }
  };

  const addSection = (type: string) => {
    if (!editingPage) return;

    const newSection: ContentSection = {
      type,
      title: "",
      subtitle: "",
      content: {},
      order: editingPage.sections.length,
      isVisible: true,
    };

    setEditingPage({
      ...editingPage,
      sections: [...editingPage.sections, newSection],
    });
  };

  const updateSection = (index: number, updates: Partial<ContentSection>) => {
    if (!editingPage) return;

    const updatedSections = editingPage.sections.map((section, i) =>
      i === index ? { ...section, ...updates } : section
    );

    setEditingPage({
      ...editingPage,
      sections: updatedSections,
    });
  };

  const removeSection = (index: number) => {
    if (!editingPage) return;

    setEditingPage({
      ...editingPage,
      sections: editingPage.sections.filter((_, i) => i !== index),
    });
  };

  const sectionTypes = [
    { value: "hero", label: "Hero Section", icon: Layout },
    { value: "features", label: "Features", icon: Star },
    { value: "reviews", label: "Reviews", icon: Star },
    { value: "cta", label: "Call to Action", icon: Type },
    { value: "custom", label: "Custom Content", icon: FileText },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Loading CMS...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Management</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your website content and settings
          </p>
        </div>
      </div>

      <Tabs defaultValue="pages" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pages" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Pages
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Site Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pages" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Content Pages</h2>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingPage({
                      slug: "",
                      title: "",
                      type: "custom",
                      isActive: true,
                      sections: [],
                    });
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Page
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingPage?.id ? "Edit Page" : "Create New Page"}
                  </DialogTitle>
                  <DialogDescription>
                    Configure your page content and sections
                  </DialogDescription>
                </DialogHeader>

                {editingPage && (
                  <div className="space-y-6">
                    {/* Page Details */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Page Title
                        </label>
                        <Input
                          value={editingPage.title}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setEditingPage({
                              ...editingPage,
                              title: e.target.value,
                            })
                          }
                          placeholder="Enter page title"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Page Slug
                        </label>
                        <Input
                          value={editingPage.slug}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setEditingPage({
                              ...editingPage,
                              slug: e.target.value,
                            })
                          }
                          placeholder="Enter page slug"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Page Type
                      </label>
                      <Select
                        value={editingPage.type}
                        onValueChange={(value: string) =>
                          setEditingPage({ ...editingPage, type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="landing">Landing Page</SelectItem>
                          <SelectItem value="about">About Page</SelectItem>
                          <SelectItem value="custom">Custom Page</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Sections */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium">Page Sections</h3>
                        <div className="flex gap-2">
                          {sectionTypes.map((type) => {
                            const Icon = type.icon;
                            return (
                              <Button
                                key={type.value}
                                variant="outline"
                                size="sm"
                                onClick={() => addSection(type.value)}
                              >
                                <Icon className="h-4 w-4 mr-1" />
                                {type.label}
                              </Button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-4">
                        {editingPage.sections.map((section, index) => (
                          <Card key={index}>
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">
                                    {section.type}
                                  </Badge>
                                  <span className="text-sm text-gray-600">
                                    Order: {section.order + 1}
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeSection(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="grid grid-cols-2 gap-4">
                                <Input
                                  placeholder="Section title"
                                  value={section.title || ""}
                                  onChange={(e) =>
                                    updateSection(index, {
                                      title: e.target.value,
                                    })
                                  }
                                />
                                <Input
                                  placeholder="Section subtitle"
                                  value={section.subtitle || ""}
                                  onChange={(e) =>
                                    updateSection(index, {
                                      subtitle: e.target.value,
                                    })
                                  }
                                />
                              </div>
                              <Textarea
                                placeholder="Content (JSON format for complex data)"
                                value={
                                  typeof section.content === "object"
                                    ? JSON.stringify(section.content, null, 2)
                                    : section.content || ""
                                }
                                onChange={(e) => {
                                  try {
                                    const parsed = JSON.parse(e.target.value);
                                    updateSection(index, { content: parsed });
                                  } catch {
                                    updateSection(index, {
                                      content: e.target.value,
                                    });
                                  }
                                }}
                                rows={4}
                              />
                              <div className="grid grid-cols-3 gap-4">
                                <Input
                                  placeholder="Image URL"
                                  value={section.imageUrl || ""}
                                  onChange={(e) =>
                                    updateSection(index, {
                                      imageUrl: e.target.value,
                                    })
                                  }
                                />
                                <Input
                                  placeholder="Button text"
                                  value={section.buttonText || ""}
                                  onChange={(e) =>
                                    updateSection(index, {
                                      buttonText: e.target.value,
                                    })
                                  }
                                />
                                <Input
                                  placeholder="Button link"
                                  value={section.buttonLink || ""}
                                  onChange={(e) =>
                                    updateSection(index, {
                                      buttonLink: e.target.value,
                                    })
                                  }
                                />
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsDialogOpen(false);
                          setEditingPage(null);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button onClick={() => savePage(editingPage)}>
                        <Save className="h-4 w-4 mr-2" />
                        Save Page
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {pages.map((page) => (
              <Card key={page.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">{page.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{page.type}</Badge>
                        <span className="text-sm text-gray-600">
                          /{page.slug}
                        </span>
                        <Badge
                          variant={page.isActive ? "default" : "secondary"}
                        >
                          {page.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {page.sections?.length || 0} sections
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          window.open(`/api/content/${page.slug}`, "_blank")
                        }
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingPage(page);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => page.id && deletePage(page.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Site Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Site Name
                  </label>
                  <Input
                    value={settings.siteName}
                    onChange={(e) =>
                      setSettings({ ...settings, siteName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Contact Email
                  </label>
                  <Input
                    value={settings.contactEmail}
                    onChange={(e) =>
                      setSettings({ ...settings, contactEmail: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Site Description
                </label>
                <Textarea
                  value={settings.siteDescription}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      siteDescription: e.target.value,
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Primary Color
                  </label>
                  <Input
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) =>
                      setSettings({ ...settings, primaryColor: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Secondary Color
                  </label>
                  <Input
                    type="color"
                    value={settings.secondaryColor}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        secondaryColor: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Logo URL
                  </label>
                  <Input
                    value={settings.logoUrl}
                    onChange={(e) =>
                      setSettings({ ...settings, logoUrl: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Free Shipping Threshold (£)
                  </label>
                  <Input
                    type="number"
                    value={settings.freeShippingThreshold}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        freeShippingThreshold: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Instagram URL
                  </label>
                  <Input
                    value={settings.socialInstagram || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        socialInstagram: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    TikTok URL
                  </label>
                  <Input
                    value={settings.socialTiktok || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, socialTiktok: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={saveSettings}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
