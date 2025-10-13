import { prisma } from "./prisma";

export interface ContentPageData {
  id: string;
  slug: string;
  title: string;
  type: string;
  isActive: boolean;
  sections: ContentSectionData[];
}

export interface ContentSectionData {
  id: string;
  type: string;
  title?: string;
  subtitle?: string;
  content?: any; // Parsed JSON content
  imageUrl?: string;
  buttonText?: string;
  buttonLink?: string;
  order: number;
  isVisible: boolean;
}

export interface SiteSettingsData {
  [key: string]: string | number | boolean;
}

export class CMSService {
  /**
   * Get a page by slug with all its sections
   */
  static async getPage(slug: string): Promise<ContentPageData | null> {
    const page = await prisma.contentPage.findUnique({
      where: { slug, isActive: true },
      include: {
        sections: {
          where: { isVisible: true },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!page) return null;

    return {
      ...page,
      sections: page.sections.map((section) => ({
        ...section,
        content: section.content ? JSON.parse(section.content) : null,
      })),
    };
  }

  /**
   * Get all pages for admin management
   */
  static async getAllPages(): Promise<ContentPageData[]> {
    const pages = await prisma.contentPage.findMany({
      include: {
        sections: {
          orderBy: { order: "asc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return pages.map((page) => ({
      ...page,
      sections: page.sections.map((section) => ({
        ...section,
        content: section.content ? JSON.parse(section.content) : null,
      })),
    }));
  }

  /**
   * Create or update a page
   */
  static async savePage(pageData: {
    id?: string;
    slug: string;
    title: string;
    type: string;
    isActive?: boolean;
    sections: Array<{
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
    }>;
  }): Promise<ContentPageData> {
    const { sections, ...page } = pageData;

    // Create or update page
    const savedPage = await prisma.contentPage.upsert({
      where: { id: pageData.id || "" },
      create: {
        slug: page.slug,
        title: page.title,
        type: page.type,
        isActive: page.isActive ?? true,
      },
      update: {
        slug: page.slug,
        title: page.title,
        type: page.type,
        isActive: page.isActive ?? true,
      },
      include: { sections: true },
    });

    // Delete existing sections and create new ones
    await prisma.contentSection.deleteMany({
      where: { pageId: savedPage.id },
    });

    if (sections.length > 0) {
      await prisma.contentSection.createMany({
        data: sections.map((section) => ({
          pageId: savedPage.id,
          type: section.type,
          title: section.title,
          subtitle: section.subtitle,
          content: section.content ? JSON.stringify(section.content) : null,
          imageUrl: section.imageUrl,
          buttonText: section.buttonText,
          buttonLink: section.buttonLink,
          order: section.order,
          isVisible: section.isVisible ?? true,
        })),
      });
    }

    return this.getPage(savedPage.slug) as Promise<ContentPageData>;
  }

  /**
   * Delete a page
   */
  static async deletePage(id: string): Promise<boolean> {
    try {
      await prisma.contentPage.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get all site settings
   */
  static async getSiteSettings(): Promise<SiteSettingsData> {
    const settings = await prisma.siteSettings.findMany();

    const settingsObject: SiteSettingsData = {};
    settings.forEach((setting) => {
      let value: string | number | boolean = setting.value;

      // Parse value based on type
      switch (setting.type) {
        case "number":
          value = parseFloat(setting.value);
          break;
        case "boolean":
          value = setting.value === "true";
          break;
        case "json":
          try {
            value = JSON.parse(setting.value);
          } catch {
            value = setting.value;
          }
          break;
        default:
          value = setting.value;
      }

      settingsObject[setting.key] = value;
    });

    return settingsObject;
  }

  /**
   * Update site settings
   */
  static async updateSiteSettings(
    settings: Record<string, any>
  ): Promise<SiteSettingsData> {
    for (const [key, value] of Object.entries(settings)) {
      const stringValue =
        typeof value === "object" ? JSON.stringify(value) : String(value);

      await prisma.siteSettings.upsert({
        where: { key },
        create: {
          key,
          value: stringValue,
          type:
            typeof value === "number"
              ? "number"
              : typeof value === "boolean"
              ? "boolean"
              : typeof value === "object"
              ? "json"
              : "text",
        },
        update: {
          value: stringValue,
        },
      });
    }

    return this.getSiteSettings();
  }

  /**
   * Get landing page content for frontend
   */
  static async getLandingPageContent(): Promise<{
    hero?: any;
    features?: any;
    reviews?: any;
    sections: ContentSectionData[];
    settings: SiteSettingsData;
  }> {
    const [page, settings] = await Promise.all([
      this.getPage("home"),
      this.getSiteSettings(),
    ]);

    if (!page) {
      return { sections: [], settings };
    }

    // Extract common sections for easier access
    const hero = page.sections.find((s) => s.type === "hero")?.content;
    const features = page.sections.find((s) => s.type === "features")?.content;
    const reviews = page.sections.find((s) => s.type === "reviews")?.content;

    return {
      hero,
      features,
      reviews,
      sections: page.sections,
      settings,
    };
  }

  /**
   * Preview content changes without saving
   */
  static async previewPage(pageData: any): Promise<ContentPageData> {
    return {
      ...pageData,
      sections: pageData.sections.map((section: any) => ({
        ...section,
        content:
          typeof section.content === "string"
            ? JSON.parse(section.content)
            : section.content,
      })),
    };
  }
}

export default CMSService;
