#!/usr/bin/env npx tsx
/**
 * CR Typed AI Generators
 *
 * Promptless generation layer with hardcoded structure.
 * Each generator has fixed section order and formatting.
 *
 * Rules:
 * - Facts only from resolved official sources
 * - Missing data → "Unknown" or "Not disclosed"
 * - No inference or assumptions
 * - Deterministic output format
 *
 * Reference: /schema/spec3.md, /schema/plan3.md Step 7
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================
// TYPES
// ============================================

export type PageType = 'entity' | 'child_entity' | 'education' | 'comparison' | 'interface' | 'metrics';
export type GeneratorType = 'entity_generator' | 'child_entity_generator' | 'education_generator' | 'comparison_generator' | 'interface_generator' | 'metrics_generator';
export type SourceScope = 'official_site' | 'official_docs' | 'product_pages' | 'campaigns' | 'analytics' | 'official_social';

export interface SourcedFact {
  field: string;
  value: string | number | boolean | string[];
  source_url: string;
  source_scope: SourceScope;
  verified: boolean;
}

export interface GeneratorInput {
  registry_id: string;
  page_type: PageType;
  source_scope: SourceScope[];
  parent_id?: string;
  entities?: string[];
  cr_required: boolean;
  facts: SourcedFact[];
}

export interface Section {
  id: string;
  title: string;
  content: string;
  order: number;
}

export interface GeneratedPage {
  registry_id: string;
  page_type: PageType;
  generator_type: GeneratorType;
  title: string;
  sections: Section[];
  cr_block?: string;
  metadata: {
    generated_at: string;
    source_count: number;
    fact_count: number;
    missing_fields: string[];
  };
}

export interface GeneratorResult {
  success: boolean;
  page?: GeneratedPage;
  errors: string[];
  warnings: string[];
}

export interface GeneratorTemplate {
  type: GeneratorType;
  page_type: PageType;
  sections: {
    id: string;
    title: string;
    required: boolean;
    order: number;
  }[];
  required_facts: string[];
}

// ============================================
// CONSTANTS
// ============================================

const UNKNOWN_VALUE = 'Unknown';
const NOT_DISCLOSED = 'Not disclosed';

// Generator type to page type mapping
export const GENERATOR_TO_PAGE_TYPE: Record<GeneratorType, PageType> = {
  entity_generator: 'entity',
  child_entity_generator: 'child_entity',
  education_generator: 'education',
  comparison_generator: 'comparison',
  interface_generator: 'interface',
  metrics_generator: 'metrics'
};

// Page type to generator type mapping
export const PAGE_TYPE_TO_GENERATOR: Record<PageType, GeneratorType> = {
  entity: 'entity_generator',
  child_entity: 'child_entity_generator',
  education: 'education_generator',
  comparison: 'comparison_generator',
  interface: 'interface_generator',
  metrics: 'metrics_generator'
};

// ============================================
// GENERATOR TEMPLATES
// ============================================

export const GENERATOR_TEMPLATES: Record<GeneratorType, GeneratorTemplate> = {
  entity_generator: {
    type: 'entity_generator',
    page_type: 'entity',
    sections: [
      { id: 'overview', title: 'Overview', required: true, order: 1 },
      { id: 'key_facts', title: 'Key Facts', required: true, order: 2 },
      { id: 'features', title: 'Features', required: false, order: 3 },
      { id: 'fees', title: 'Fees', required: false, order: 4 },
      { id: 'supported_assets', title: 'Supported Assets', required: false, order: 5 },
      { id: 'security', title: 'Security', required: false, order: 6 },
      { id: 'official_links', title: 'Official Links', required: true, order: 7 }
    ],
    required_facts: ['name', 'type', 'url']
  },

  child_entity_generator: {
    type: 'child_entity_generator',
    page_type: 'child_entity',
    sections: [
      { id: 'overview', title: 'Overview', required: true, order: 1 },
      { id: 'relationship', title: 'Relationship to Parent', required: true, order: 2 },
      { id: 'key_facts', title: 'Key Facts', required: true, order: 3 },
      { id: 'features', title: 'Features', required: false, order: 4 },
      { id: 'official_links', title: 'Official Links', required: true, order: 5 }
    ],
    required_facts: ['name', 'parent_name', 'url']
  },

  education_generator: {
    type: 'education_generator',
    page_type: 'education',
    sections: [
      { id: 'introduction', title: 'Introduction', required: true, order: 1 },
      { id: 'explanation', title: 'Explanation', required: true, order: 2 },
      { id: 'key_points', title: 'Key Points', required: true, order: 3 },
      { id: 'examples', title: 'Examples', required: false, order: 4 },
      { id: 'related_topics', title: 'Related Topics', required: false, order: 5 }
    ],
    required_facts: ['topic', 'definition']
  },

  comparison_generator: {
    type: 'comparison_generator',
    page_type: 'comparison',
    sections: [
      { id: 'overview', title: 'Overview', required: true, order: 1 },
      { id: 'comparison_table', title: 'Comparison Table', required: true, order: 2 },
      { id: 'detailed_comparison', title: 'Detailed Comparison', required: true, order: 3 },
      { id: 'key_differences', title: 'Key Differences', required: true, order: 4 },
      { id: 'use_cases', title: 'Use Cases', required: false, order: 5 }
    ],
    required_facts: ['entities', 'comparison_criteria']
  },

  interface_generator: {
    type: 'interface_generator',
    page_type: 'interface',
    sections: [
      { id: 'overview', title: 'Overview', required: true, order: 1 },
      { id: 'navigation', title: 'Navigation', required: true, order: 2 },
      { id: 'main_features', title: 'Main Features', required: true, order: 3 },
      { id: 'step_by_step', title: 'Step-by-Step Guide', required: false, order: 4 },
      { id: 'tips', title: 'Tips', required: false, order: 5 }
    ],
    required_facts: ['interface_name', 'platform']
  },

  metrics_generator: {
    type: 'metrics_generator',
    page_type: 'metrics',
    sections: [
      { id: 'overview', title: 'Overview', required: true, order: 1 },
      { id: 'metrics_table', title: 'Metrics', required: true, order: 2 },
      { id: 'methodology', title: 'Methodology', required: false, order: 3 },
      { id: 'data_sources', title: 'Data Sources', required: true, order: 4 }
    ],
    required_facts: ['metric_name', 'data_source']
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get fact value or default
 */
export function getFactValue(
  facts: SourcedFact[],
  field: string,
  defaultValue: string = UNKNOWN_VALUE
): string {
  const fact = facts.find(f => f.field === field && f.verified);
  if (!fact) return defaultValue;

  if (Array.isArray(fact.value)) {
    return fact.value.join(', ');
  }

  return String(fact.value);
}

/**
 * Get fact as array
 */
export function getFactArray(facts: SourcedFact[], field: string): string[] {
  const fact = facts.find(f => f.field === field && f.verified);
  if (!fact) return [];

  if (Array.isArray(fact.value)) {
    return fact.value.map(String);
  }

  return [String(fact.value)];
}

/**
 * Check if fact exists and is verified
 */
export function hasFact(facts: SourcedFact[], field: string): boolean {
  return facts.some(f => f.field === field && f.verified);
}

/**
 * Get missing required facts
 */
export function getMissingFacts(facts: SourcedFact[], required: string[]): string[] {
  return required.filter(field => !hasFact(facts, field));
}

/**
 * Format value for display (handle unknown/not disclosed)
 */
export function formatValue(value: string | undefined | null): string {
  if (value === undefined || value === null || value === '') {
    return UNKNOWN_VALUE;
  }
  return value;
}

/**
 * Generate table row
 */
export function tableRow(label: string, value: string): string {
  return `| ${label} | ${formatValue(value)} |`;
}

// ============================================
// BASE GENERATOR CLASS
// ============================================

export abstract class BaseGenerator {
  protected template: GeneratorTemplate;
  protected input: GeneratorInput;
  protected errors: string[] = [];
  protected warnings: string[] = [];

  constructor(template: GeneratorTemplate, input: GeneratorInput) {
    this.template = template;
    this.input = input;
  }

  /**
   * Validate input matches generator type
   */
  protected validateInput(): boolean {
    if (this.input.page_type !== this.template.page_type) {
      this.errors.push(
        `Generator mismatch: ${this.template.type} expects page_type "${this.template.page_type}", ` +
        `got "${this.input.page_type}"`
      );
      return false;
    }
    return true;
  }

  /**
   * Check required facts
   */
  protected checkRequiredFacts(): void {
    const missing = getMissingFacts(this.input.facts, this.template.required_facts);
    if (missing.length > 0) {
      this.warnings.push(`Missing required facts: ${missing.join(', ')}`);
    }
  }

  /**
   * Generate section content (to be implemented by subclasses)
   */
  protected abstract generateSectionContent(sectionId: string): string;

  /**
   * Generate CR block (only for entity types)
   */
  protected generateCRBlock(): string | undefined {
    if (!this.input.cr_required) {
      return undefined;
    }

    const name = getFactValue(this.input.facts, 'name');
    const type = getFactValue(this.input.facts, 'type', 'unknown');
    const url = getFactValue(this.input.facts, 'url', '');
    const network = getFactValue(this.input.facts, 'network', 'unknown');

    const token = this.input.registry_id.toUpperCase().replace(/-/g, '_');

    const lines = [
      `[CR/${token}]`,
      `schema=CR1.0`,
      `version=1.0`,
      `type=${type}`,
      `network=${network}`,
      `name=${name}`,
      `status=active`
    ];

    if (url && url !== UNKNOWN_VALUE) {
      lines.push(`url=${url}`);
    }

    lines.push(`[/CR]`);

    return lines.join('\n');
  }

  /**
   * Generate the page
   */
  public generate(): GeneratorResult {
    // Validate input
    if (!this.validateInput()) {
      return {
        success: false,
        errors: this.errors,
        warnings: this.warnings
      };
    }

    // Check required facts
    this.checkRequiredFacts();

    // Generate sections
    const sections: Section[] = [];
    for (const sectionDef of this.template.sections) {
      const content = this.generateSectionContent(sectionDef.id);

      if (sectionDef.required && !content) {
        this.errors.push(`Required section "${sectionDef.id}" has no content`);
        continue;
      }

      if (content) {
        sections.push({
          id: sectionDef.id,
          title: sectionDef.title,
          content,
          order: sectionDef.order
        });
      }
    }

    // Sort sections by order
    sections.sort((a, b) => a.order - b.order);

    // Generate CR block if required
    const crBlock = this.generateCRBlock();

    // Calculate missing fields
    const missingFields = getMissingFacts(this.input.facts, this.template.required_facts);

    // Create page
    const page: GeneratedPage = {
      registry_id: this.input.registry_id,
      page_type: this.input.page_type,
      generator_type: this.template.type,
      title: this.generateTitle(),
      sections,
      cr_block: crBlock,
      metadata: {
        generated_at: new Date().toISOString(),
        source_count: new Set(this.input.facts.map(f => f.source_url)).size,
        fact_count: this.input.facts.filter(f => f.verified).length,
        missing_fields: missingFields
      }
    };

    return {
      success: this.errors.length === 0,
      page,
      errors: this.errors,
      warnings: this.warnings
    };
  }

  /**
   * Generate page title
   */
  protected generateTitle(): string {
    const name = getFactValue(this.input.facts, 'name', this.input.registry_id);
    return name;
  }
}

// ============================================
// ENTITY GENERATOR
// ============================================

export class EntityGenerator extends BaseGenerator {
  constructor(input: GeneratorInput) {
    super(GENERATOR_TEMPLATES.entity_generator, input);
  }

  protected generateSectionContent(sectionId: string): string {
    const facts = this.input.facts;

    switch (sectionId) {
      case 'overview': {
        const name = getFactValue(facts, 'name');
        const type = getFactValue(facts, 'type');
        const description = getFactValue(facts, 'description', `${name} is a ${type}.`);
        return description;
      }

      case 'key_facts': {
        const rows = [
          '| Attribute | Value |',
          '|-----------|-------|',
          tableRow('Name', getFactValue(facts, 'name')),
          tableRow('Type', getFactValue(facts, 'type')),
          tableRow('Founded', getFactValue(facts, 'founded', NOT_DISCLOSED)),
          tableRow('Headquarters', getFactValue(facts, 'headquarters', NOT_DISCLOSED)),
          tableRow('Website', getFactValue(facts, 'url'))
        ];
        return rows.join('\n');
      }

      case 'features': {
        const features = getFactArray(facts, 'features');
        if (features.length === 0) return '';
        return features.map(f => `- ${f}`).join('\n');
      }

      case 'fees': {
        const hasFees = hasFact(facts, 'trading_fee_maker') || hasFact(facts, 'trading_fee_taker');
        if (!hasFees) return '';

        const rows = [
          '| Fee Type | Value |',
          '|----------|-------|',
          tableRow('Maker Fee', getFactValue(facts, 'trading_fee_maker', NOT_DISCLOSED)),
          tableRow('Taker Fee', getFactValue(facts, 'trading_fee_taker', NOT_DISCLOSED))
        ];
        return rows.join('\n');
      }

      case 'supported_assets': {
        const assets = getFactArray(facts, 'supported_assets');
        if (assets.length === 0) {
          const count = getFactValue(facts, 'trading_pairs', NOT_DISCLOSED);
          return `Trading pairs: ${count}`;
        }
        return assets.map(a => `- ${a}`).join('\n');
      }

      case 'security': {
        const security = getFactArray(facts, 'security_features');
        if (security.length === 0) return '';
        return security.map(s => `- ${s}`).join('\n');
      }

      case 'official_links': {
        const url = getFactValue(facts, 'url');
        const twitter = getFactValue(facts, 'twitter', '');
        const docs = getFactValue(facts, 'docs_url', '');

        const links = [`- Website: ${url}`];
        if (twitter && twitter !== UNKNOWN_VALUE) links.push(`- Twitter: ${twitter}`);
        if (docs && docs !== UNKNOWN_VALUE) links.push(`- Documentation: ${docs}`);

        return links.join('\n');
      }

      default:
        return '';
    }
  }
}

// ============================================
// CHILD ENTITY GENERATOR
// ============================================

export class ChildEntityGenerator extends BaseGenerator {
  constructor(input: GeneratorInput) {
    super(GENERATOR_TEMPLATES.child_entity_generator, input);
  }

  protected generateSectionContent(sectionId: string): string {
    const facts = this.input.facts;

    switch (sectionId) {
      case 'overview': {
        const name = getFactValue(facts, 'name');
        const parentName = getFactValue(facts, 'parent_name');
        return `${name} is a feature/product of ${parentName}.`;
      }

      case 'relationship': {
        const parentName = getFactValue(facts, 'parent_name');
        return `This is a sub-entity of ${parentName}. Parent ID: ${this.input.parent_id || UNKNOWN_VALUE}`;
      }

      case 'key_facts': {
        const rows = [
          '| Attribute | Value |',
          '|-----------|-------|',
          tableRow('Name', getFactValue(facts, 'name')),
          tableRow('Parent', getFactValue(facts, 'parent_name')),
          tableRow('Type', getFactValue(facts, 'subtype', NOT_DISCLOSED))
        ];
        return rows.join('\n');
      }

      case 'features': {
        const features = getFactArray(facts, 'features');
        if (features.length === 0) return '';
        return features.map(f => `- ${f}`).join('\n');
      }

      case 'official_links': {
        const url = getFactValue(facts, 'url');
        return `- Product Page: ${url}`;
      }

      default:
        return '';
    }
  }
}

// ============================================
// EDUCATION GENERATOR
// ============================================

export class EducationGenerator extends BaseGenerator {
  constructor(input: GeneratorInput) {
    super(GENERATOR_TEMPLATES.education_generator, input);
  }

  protected generateSectionContent(sectionId: string): string {
    const facts = this.input.facts;

    switch (sectionId) {
      case 'introduction': {
        const topic = getFactValue(facts, 'topic');
        const definition = getFactValue(facts, 'definition');
        return `${topic}: ${definition}`;
      }

      case 'explanation': {
        return getFactValue(facts, 'explanation', 'Detailed explanation not available.');
      }

      case 'key_points': {
        const points = getFactArray(facts, 'key_points');
        if (points.length === 0) {
          return '- Key information not available';
        }
        return points.map(p => `- ${p}`).join('\n');
      }

      case 'examples': {
        const examples = getFactArray(facts, 'examples');
        if (examples.length === 0) return '';
        return examples.map((e, i) => `${i + 1}. ${e}`).join('\n');
      }

      case 'related_topics': {
        const related = getFactArray(facts, 'related_topics');
        if (related.length === 0) return '';
        return related.map(r => `- ${r}`).join('\n');
      }

      default:
        return '';
    }
  }

  protected generateTitle(): string {
    return getFactValue(this.input.facts, 'topic', this.input.registry_id);
  }
}

// ============================================
// COMPARISON GENERATOR
// ============================================

export class ComparisonGenerator extends BaseGenerator {
  constructor(input: GeneratorInput) {
    super(GENERATOR_TEMPLATES.comparison_generator, input);
  }

  protected generateSectionContent(sectionId: string): string {
    const facts = this.input.facts;
    const entities = this.input.entities || [];

    switch (sectionId) {
      case 'overview': {
        if (entities.length < 2) {
          return 'Comparison requires at least 2 entities.';
        }
        return `This comparison analyzes ${entities.join(' vs ')}.`;
      }

      case 'comparison_table': {
        if (entities.length < 2) return '';

        const criteria = getFactArray(facts, 'comparison_criteria');
        if (criteria.length === 0) {
          return 'Comparison criteria not available.';
        }

        const header = `| Criteria | ${entities.join(' | ')} |`;
        const separator = `|----------|${entities.map(() => '---').join('|')}|`;

        const rows = criteria.map(c => {
          const values = entities.map(e => {
            const factField = `${e}_${c.toLowerCase().replace(/\s+/g, '_')}`;
            return getFactValue(facts, factField, NOT_DISCLOSED);
          });
          return `| ${c} | ${values.join(' | ')} |`;
        });

        return [header, separator, ...rows].join('\n');
      }

      case 'detailed_comparison': {
        return getFactValue(facts, 'detailed_comparison', 'Detailed comparison not available.');
      }

      case 'key_differences': {
        const differences = getFactArray(facts, 'key_differences');
        if (differences.length === 0) {
          return '- Key differences not available';
        }
        return differences.map(d => `- ${d}`).join('\n');
      }

      case 'use_cases': {
        const useCases = getFactArray(facts, 'use_cases');
        if (useCases.length === 0) return '';
        return useCases.map(u => `- ${u}`).join('\n');
      }

      default:
        return '';
    }
  }

  protected generateTitle(): string {
    const entities = this.input.entities || [];
    if (entities.length >= 2) {
      return `${entities.join(' vs ')} Comparison`;
    }
    return this.input.registry_id;
  }
}

// ============================================
// INTERFACE GENERATOR
// ============================================

export class InterfaceGenerator extends BaseGenerator {
  constructor(input: GeneratorInput) {
    super(GENERATOR_TEMPLATES.interface_generator, input);
  }

  protected generateSectionContent(sectionId: string): string {
    const facts = this.input.facts;

    switch (sectionId) {
      case 'overview': {
        const name = getFactValue(facts, 'interface_name');
        const platform = getFactValue(facts, 'platform');
        return `${name} interface on ${platform}.`;
      }

      case 'navigation': {
        const nav = getFactArray(facts, 'navigation_items');
        if (nav.length === 0) {
          return 'Navigation structure not available.';
        }
        return nav.map(n => `- ${n}`).join('\n');
      }

      case 'main_features': {
        const features = getFactArray(facts, 'interface_features');
        if (features.length === 0) {
          return '- Interface features not documented';
        }
        return features.map(f => `- ${f}`).join('\n');
      }

      case 'step_by_step': {
        const steps = getFactArray(facts, 'steps');
        if (steps.length === 0) return '';
        return steps.map((s, i) => `${i + 1}. ${s}`).join('\n');
      }

      case 'tips': {
        const tips = getFactArray(facts, 'tips');
        if (tips.length === 0) return '';
        return tips.map(t => `- ${t}`).join('\n');
      }

      default:
        return '';
    }
  }

  protected generateTitle(): string {
    const name = getFactValue(this.input.facts, 'interface_name', this.input.registry_id);
    return `${name} Interface Guide`;
  }
}

// ============================================
// METRICS GENERATOR
// ============================================

export class MetricsGenerator extends BaseGenerator {
  constructor(input: GeneratorInput) {
    super(GENERATOR_TEMPLATES.metrics_generator, input);
  }

  protected generateSectionContent(sectionId: string): string {
    const facts = this.input.facts;

    switch (sectionId) {
      case 'overview': {
        const name = getFactValue(facts, 'metric_name');
        const description = getFactValue(facts, 'metric_description', `${name} metrics and data.`);
        return description;
      }

      case 'metrics_table': {
        const metrics = getFactArray(facts, 'metrics');
        if (metrics.length === 0) {
          return '| Metric | Value |\n|--------|-------|\n| Data | Not available |';
        }

        const rows = [
          '| Metric | Value |',
          '|--------|-------|'
        ];

        for (const m of metrics) {
          const value = getFactValue(facts, `metric_${m.toLowerCase().replace(/\s+/g, '_')}`, NOT_DISCLOSED);
          rows.push(tableRow(m, value));
        }

        return rows.join('\n');
      }

      case 'methodology': {
        return getFactValue(facts, 'methodology', '');
      }

      case 'data_sources': {
        const source = getFactValue(facts, 'data_source');
        const sources = getFactArray(facts, 'data_sources');

        if (sources.length > 0) {
          return sources.map(s => `- ${s}`).join('\n');
        }

        return `- ${source}`;
      }

      default:
        return '';
    }
  }

  protected generateTitle(): string {
    return getFactValue(this.input.facts, 'metric_name', this.input.registry_id);
  }
}

// ============================================
// GENERATOR FACTORY
// ============================================

/**
 * Create generator instance for given input
 */
export function createGenerator(input: GeneratorInput): BaseGenerator {
  const generatorType = PAGE_TYPE_TO_GENERATOR[input.page_type];

  switch (generatorType) {
    case 'entity_generator':
      return new EntityGenerator(input);
    case 'child_entity_generator':
      return new ChildEntityGenerator(input);
    case 'education_generator':
      return new EducationGenerator(input);
    case 'comparison_generator':
      return new ComparisonGenerator(input);
    case 'interface_generator':
      return new InterfaceGenerator(input);
    case 'metrics_generator':
      return new MetricsGenerator(input);
    default:
      throw new Error(`Unknown generator type: ${generatorType}`);
  }
}

/**
 * Generate page from input
 */
export function generatePage(input: GeneratorInput): GeneratorResult {
  try {
    const generator = createGenerator(input);
    return generator.generate();
  } catch (error) {
    return {
      success: false,
      errors: [`Generator error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: []
    };
  }
}

// ============================================
// ACCEPTANCE TESTS
// ============================================

function runAcceptanceTests(): { passed: boolean; results: string[] } {
  const results: string[] = [];
  let allPassed = true;

  console.log('Typed AI Generators - Acceptance Tests\n');
  console.log('='.repeat(50));

  // Test 1: Entity generator creates valid page
  const entityInput: GeneratorInput = {
    registry_id: 'binance',
    page_type: 'entity',
    source_scope: ['official_site'],
    cr_required: true,
    facts: [
      { field: 'name', value: 'Binance', source_url: 'https://binance.com', source_scope: 'official_site', verified: true },
      { field: 'type', value: 'exchange', source_url: 'https://binance.com', source_scope: 'official_site', verified: true },
      { field: 'url', value: 'https://binance.com', source_url: 'https://binance.com', source_scope: 'official_site', verified: true }
    ]
  };
  const entityResult = generatePage(entityInput);
  if (entityResult.success && entityResult.page?.generator_type === 'entity_generator') {
    results.push('PASS: Test 1 - Entity generator creates valid page');
  } else {
    results.push('FAIL: Test 1 - Entity generator should create valid page');
    results.push(`  Errors: ${entityResult.errors.join(', ')}`);
    allPassed = false;
  }

  // Test 2: Generator mismatch detected
  const mismatchInput: GeneratorInput = {
    registry_id: 'test',
    page_type: 'education',
    source_scope: [],
    cr_required: false,
    facts: []
  };
  const generator = new EntityGenerator(mismatchInput);
  const mismatchResult = generator.generate();
  if (!mismatchResult.success && mismatchResult.errors.some(e => e.includes('mismatch'))) {
    results.push('PASS: Test 2 - Generator mismatch detected');
  } else {
    results.push('FAIL: Test 2 - Generator mismatch should be detected');
    allPassed = false;
  }

  // Test 3: CR block generated for entity
  if (entityResult.page?.cr_block && entityResult.page.cr_block.includes('[CR/BINANCE]')) {
    results.push('PASS: Test 3 - CR block generated for entity');
  } else {
    results.push('FAIL: Test 3 - CR block should be generated for entity');
    allPassed = false;
  }

  // Test 4: No CR block for education
  const eduInput: GeneratorInput = {
    registry_id: 'test-topic',
    page_type: 'education',
    source_scope: [],
    cr_required: false,
    facts: [
      { field: 'topic', value: 'Test Topic', source_url: 'https://example.com', source_scope: 'official_docs', verified: true },
      { field: 'definition', value: 'Test definition', source_url: 'https://example.com', source_scope: 'official_docs', verified: true }
    ]
  };
  const eduResult = generatePage(eduInput);
  if (eduResult.success && !eduResult.page?.cr_block) {
    results.push('PASS: Test 4 - No CR block for education');
  } else {
    results.push('FAIL: Test 4 - Education should not have CR block');
    allPassed = false;
  }

  // Test 5: Missing facts use Unknown
  const missingInput: GeneratorInput = {
    registry_id: 'test',
    page_type: 'entity',
    source_scope: [],
    cr_required: true,
    facts: [
      { field: 'name', value: 'Test', source_url: 'https://example.com', source_scope: 'official_site', verified: true }
    ]
  };
  const missingResult = generatePage(missingInput);
  const hasUnknown = missingResult.page?.sections.some(s => s.content.includes('Unknown'));
  if (hasUnknown) {
    results.push('PASS: Test 5 - Missing facts use Unknown');
  } else {
    results.push('FAIL: Test 5 - Missing facts should use Unknown');
    allPassed = false;
  }

  // Test 6: Sections in correct order
  if (entityResult.page?.sections) {
    const orders = entityResult.page.sections.map(s => s.order);
    const sorted = [...orders].sort((a, b) => a - b);
    if (JSON.stringify(orders) === JSON.stringify(sorted)) {
      results.push('PASS: Test 6 - Sections in correct order');
    } else {
      results.push('FAIL: Test 6 - Sections should be in order');
      allPassed = false;
    }
  }

  // Test 7: Comparison generator works
  const compInput: GeneratorInput = {
    registry_id: 'binance-vs-okx',
    page_type: 'comparison',
    source_scope: [],
    cr_required: false,
    entities: ['binance', 'okx'],
    facts: [
      { field: 'entities', value: ['binance', 'okx'], source_url: 'https://example.com', source_scope: 'official_site', verified: true },
      { field: 'comparison_criteria', value: ['Fees', 'Features'], source_url: 'https://example.com', source_scope: 'official_site', verified: true }
    ]
  };
  const compResult = generatePage(compInput);
  if (compResult.success && compResult.page?.title.includes('vs')) {
    results.push('PASS: Test 7 - Comparison generator works');
  } else {
    results.push('FAIL: Test 7 - Comparison generator should work');
    allPassed = false;
  }

  // Test 8: Child entity generator works
  const childInput: GeneratorInput = {
    registry_id: 'binance-futures',
    page_type: 'child_entity',
    source_scope: [],
    parent_id: 'binance',
    cr_required: true,
    facts: [
      { field: 'name', value: 'Binance Futures', source_url: 'https://binance.com', source_scope: 'official_site', verified: true },
      { field: 'parent_name', value: 'Binance', source_url: 'https://binance.com', source_scope: 'official_site', verified: true },
      { field: 'url', value: 'https://binance.com/futures', source_url: 'https://binance.com', source_scope: 'official_site', verified: true }
    ]
  };
  const childResult = generatePage(childInput);
  if (childResult.success && childResult.page?.sections.some(s => s.id === 'relationship')) {
    results.push('PASS: Test 8 - Child entity generator works');
  } else {
    results.push('FAIL: Test 8 - Child entity generator should work');
    allPassed = false;
  }

  // Test 9: Metadata includes fact count
  if (entityResult.page?.metadata.fact_count === 3) {
    results.push('PASS: Test 9 - Metadata includes correct fact count');
  } else {
    results.push('FAIL: Test 9 - Metadata should include correct fact count');
    allPassed = false;
  }

  // Test 10: Metadata includes source count
  if (entityResult.page?.metadata.source_count === 1) {
    results.push('PASS: Test 10 - Metadata includes correct source count');
  } else {
    results.push('FAIL: Test 10 - Metadata should include correct source count');
    allPassed = false;
  }

  // Test 11: createGenerator factory works
  try {
    const gen = createGenerator(entityInput);
    if (gen instanceof EntityGenerator) {
      results.push('PASS: Test 11 - createGenerator factory works');
    } else {
      results.push('FAIL: Test 11 - createGenerator should return correct type');
      allPassed = false;
    }
  } catch {
    results.push('FAIL: Test 11 - createGenerator threw error');
    allPassed = false;
  }

  // Test 12: All generator types have templates
  const allTemplates = Object.keys(GENERATOR_TEMPLATES).length === 6;
  if (allTemplates) {
    results.push('PASS: Test 12 - All generator types have templates');
  } else {
    results.push('FAIL: Test 12 - All generator types should have templates');
    allPassed = false;
  }

  // Test 13: Required sections are enforced
  const emptyInput: GeneratorInput = {
    registry_id: 'empty',
    page_type: 'entity',
    source_scope: [],
    cr_required: true,
    facts: []
  };
  const emptyResult = generatePage(emptyInput);
  // Should still generate with Unknown values
  if (emptyResult.page?.sections.length && emptyResult.page.sections.length > 0) {
    results.push('PASS: Test 13 - Required sections generated even with no facts');
  } else {
    results.push('FAIL: Test 13 - Required sections should be generated');
    allPassed = false;
  }

  // Test 14: Only verified facts used
  const unverifiedInput: GeneratorInput = {
    registry_id: 'test',
    page_type: 'entity',
    source_scope: [],
    cr_required: true,
    facts: [
      { field: 'name', value: 'Verified', source_url: 'https://example.com', source_scope: 'official_site', verified: true },
      { field: 'type', value: 'Unverified', source_url: 'https://example.com', source_scope: 'official_site', verified: false }
    ]
  };
  const unverifiedResult = generatePage(unverifiedInput);
  const typeSection = unverifiedResult.page?.sections.find(s => s.id === 'key_facts');
  if (typeSection && typeSection.content.includes('Unknown') && !typeSection.content.includes('Unverified')) {
    results.push('PASS: Test 14 - Only verified facts used');
  } else {
    results.push('FAIL: Test 14 - Only verified facts should be used');
    allPassed = false;
  }

  // Test 15: Interface generator works
  const interfaceInput: GeneratorInput = {
    registry_id: 'binance-interface',
    page_type: 'interface',
    source_scope: [],
    cr_required: false,
    facts: [
      { field: 'interface_name', value: 'Trading Interface', source_url: 'https://example.com', source_scope: 'official_site', verified: true },
      { field: 'platform', value: 'Binance', source_url: 'https://example.com', source_scope: 'official_site', verified: true }
    ]
  };
  const interfaceResult = generatePage(interfaceInput);
  if (interfaceResult.success) {
    results.push('PASS: Test 15 - Interface generator works');
  } else {
    results.push('FAIL: Test 15 - Interface generator should work');
    allPassed = false;
  }

  // Test 16: Metrics generator works
  const metricsInput: GeneratorInput = {
    registry_id: 'volume-metrics',
    page_type: 'metrics',
    source_scope: [],
    cr_required: false,
    facts: [
      { field: 'metric_name', value: 'Trading Volume', source_url: 'https://example.com', source_scope: 'analytics', verified: true },
      { field: 'data_source', value: 'Dune Analytics', source_url: 'https://example.com', source_scope: 'analytics', verified: true }
    ]
  };
  const metricsResult = generatePage(metricsInput);
  if (metricsResult.success) {
    results.push('PASS: Test 16 - Metrics generator works');
  } else {
    results.push('FAIL: Test 16 - Metrics generator should work');
    allPassed = false;
  }

  // Test 17: Missing fields tracked in metadata
  if (missingResult.page?.metadata.missing_fields.includes('type')) {
    results.push('PASS: Test 17 - Missing fields tracked in metadata');
  } else {
    results.push('FAIL: Test 17 - Missing fields should be tracked');
    allPassed = false;
  }

  // Test 18: Table formatting correct
  const tableSection = entityResult.page?.sections.find(s => s.id === 'key_facts');
  if (tableSection && tableSection.content.includes('|') && tableSection.content.includes('---')) {
    results.push('PASS: Test 18 - Table formatting correct');
  } else {
    results.push('FAIL: Test 18 - Table formatting should be correct');
    allPassed = false;
  }

  // Test 19: getFactValue with array
  const arrayFact: SourcedFact = {
    field: 'features',
    value: ['a', 'b', 'c'],
    source_url: 'https://example.com',
    source_scope: 'official_site',
    verified: true
  };
  const arrayValue = getFactValue([arrayFact], 'features');
  if (arrayValue === 'a, b, c') {
    results.push('PASS: Test 19 - getFactValue handles arrays');
  } else {
    results.push('FAIL: Test 19 - getFactValue should handle arrays');
    allPassed = false;
  }

  // Test 20: Generated timestamp valid
  if (entityResult.page?.metadata.generated_at && !isNaN(Date.parse(entityResult.page.metadata.generated_at))) {
    results.push('PASS: Test 20 - Generated timestamp is valid');
  } else {
    results.push('FAIL: Test 20 - Generated timestamp should be valid');
    allPassed = false;
  }

  return { passed: allPassed, results };
}

// ============================================
// CLI RUNNER
// ============================================

if (typeof require !== 'undefined' && require.main === module) {
  const { passed, results } = runAcceptanceTests();

  for (const result of results) {
    console.log(result);
  }

  console.log('='.repeat(50));
  console.log(`\nOverall: ${passed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);

  process.exit(passed ? 0 : 1);
}
