export class PlatformGuard {
  static readonly LIMITS = {
    twitter: { maxChars: 280, supportsMarkdown: false },
    linkedin: { maxChars: 3000, supportsMarkdown: true },
    facebook: { maxChars: 5000, supportsMarkdown: false },
  };

  /**
   * Strips basic markdown elements from a text string.
   */
  static stripMarkdown(text: string): string {
    if (!text) return '';
    return text
      .replace(/(\*\*|__)(.*?)\1/g, '$2') // bold
      .replace(/(\*|_)(.*?)\1/g, '$2') // italics
      .replace(/`([^`]+)`/g, '$1') // inline code
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1') // links
      .replace(/#+\s+(.*)/g, '$1') // headers
      .replace(/^\s*-\s+(.*)/gm, '$1') // bullets
      .replace(/^\s*\d+\.\s+(.*)/gm, '$1'); // numbered lists
  }

  /**
   * Validates and processes content based on platform rules.
   * If a platform doesn't support markdown, it strips markdown.
   * If a platform has character constraints, it slices the content to the limit.
   */
  static validateAndProcess(platform: string, content: string): string {
    const key = platform.toLowerCase();
    const config = this.LIMITS[key as keyof typeof this.LIMITS];

    if (!config) {
      // Default fallback constraints if platform not explicitly defined
      return content ? content.trim() : '';
    }

    let processed = content || '';

    // Strip markdown if not supported
    if (!config.supportsMarkdown) {
      processed = this.stripMarkdown(processed);
    }

    processed = processed.trim();

    // Enforce char limit
    if (processed.length > config.maxChars) {
      processed = processed.substring(0, config.maxChars).trim();
    }

    return processed;
  }
}
