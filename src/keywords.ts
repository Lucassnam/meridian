import type { DomainId } from './types';

/**
 * Deterministic keyword table. No model call, no network — this must work
 * offline at the demo.
 *
 * Terms are lowercase and matched case-insensitively against the user's
 * free-text profile entries. Terms of 4+ characters match as plain
 * substrings ('biotech' hits 'biotechnology'). Terms of 3 characters or
 * fewer are matched on word boundaries instead, so 'ai' does not fire on
 * 'email' or 'chair' — see scoring.ts.
 */
export const KEYWORDS: Record<DomainId, string[]> = {
  biotech: [
    'biotech', 'bio', 'life science', 'genomic', 'genome', 'gene', 'crispr',
    'dna', 'rna', 'sequencing', 'molecul', 'protein', 'synthetic biology',
    'therapeutic', 'drug discovery', 'pharma', 'clinical trial', 'bioinformatic',
    'lab', 'wet lab', 'antibody', 'vaccine', 'microbio', 'stem cell', 'oncolog',
  ],
  cleanenergy: [
    'clean energy', 'climate', 'renewable', 'solar', 'wind', 'geothermal',
    'battery', 'batteries', 'storage', 'grid', 'decarboniz', 'decarbonis',
    'carbon', 'emissions', 'net zero', 'sustainab', 'green tech', 'ev',
    'electric vehicle', 'nuclear', 'fusion', 'hydrogen', 'energy transition',
    'cleantech', 'environment',
  ],
  ai: [
    'ai', 'a.i.', 'artificial intelligence', 'machine learning', 'ml',
    'deep learning', 'neural', 'llm', 'language model', 'transformer',
    'gpt', 'diffusion', 'inference', 'training run', 'fine-tun', 'finetun',
    'embedding', 'rag', 'agent', 'alignment', 'interpretab', 'computer vision',
    'nlp', 'model eval', 'reinforcement learning',
  ],
  software: [
    'software', 'engineering', 'developer', 'programming', 'coding', 'backend',
    'frontend', 'full stack', 'fullstack', 'devops', 'infrastructure', 'api',
    'database', 'distributed system', 'compiler', 'open source', 'kubernetes',
    'cloud', 'typescript', 'javascript', 'python', 'rust', 'golang',
    'web dev', 'platform',
  ],
  design: [
    'design', 'product', 'ux', 'ui', 'user experience', 'user research',
    'prototyp', 'figma', 'wireframe', 'typography', 'brand', 'visual',
    'interaction', 'design system', 'usability', 'product management',
    'roadmap', 'user testing', 'craft', 'aesthetic', 'illustration',
    'industrial design', 'information architecture', 'motion design', 
  ],
  capital: [
    'capital', 'invest', 'venture', 'vc', 'fund', 'fundrais', 'seed round',
    'series a', 'angel', 'cap table', 'valuation', 'private equity',
    'hedge fund', 'portfolio', 'term sheet', 'due diligence', 'finance',
    'banking', 'm&a', 'ipo', 'trading', 'asset', 'wealth', 'startup funding',
  ],
  health: [
    'health', 'healthcare', 'medicine', 'medical', 'clinic', 'hospital',
    'patient', 'physician', 'doctor', 'nurse', 'surgery', 'diagnos',
    'telemedicine', 'digital health', 'mental health', 'therapy',
    'public health', 'epidemiolog', 'wellness', 'nutrition', 'care delivery',
    'payer', 'insurance', 'fda', 'medtech',
  ],
  policy: [
    'policy', 'government', 'regulat', 'legislat', 'congress', 'senate',
    'federal', 'municipal', 'city council', 'public sector', 'civic',
    'campaign', 'lobby', 'advocacy', 'nonprofit', 'ngo', 'diplomacy',
    'governance', 'election', 'political', 'state department', 'agency',
    'compliance', 'think tank', 'public interest',
  ],
  media: [
    'media', 'journalis', 'reporter', 'editor', 'newsroom', 'publishing',
    'writing', 'writer', 'podcast', 'documentary', 'film', 'video',
    'broadcast', 'newsletter', 'substack', 'content', 'storytelling',
    'photograph', 'social media', 'creator', 'blog', 'magazine', 'press',
    'communications', 
  ],
  academia: [
    'academi', 'research', 'professor', 'phd', 'postdoc', 'universit',
    'college', 'teaching', 'education', 'curriculum', 'student', 'lecture',
    'thesis', 'dissertation', 'grant', 'fellowship', 'scholar', 'seminar',
    'tenure', 'edtech', 'school', 'tutoring', 'pedagog', 'lab group',
    'publication',
  ],
  legal: [
    'legal', 'law', 'lawyer', 'attorney', 'counsel', 'litigation', 'contract',
    'patent', 'trademark', 'intellectual property', 'ip law', 'compliance',
    'regulatory', 'court', 'judge', 'paralegal', 'incorporat', 'terms of service',
    'privacy law', 'gdpr', 'employment law', 'securities', 'arbitration',
    'licensing', 'general counsel',
  ],
  ops: [
    'operations', 'ops', 'supply chain', 'logistics', 'manufactur',
    'procurement', 'sourcing', 'vendor', 'inventory', 'warehouse', 'shipping',
    'freight', 'fulfillment', 'fulfilment', 'contract manufactur', 'factory',
    'production', 'quality control', 'lean', 'process improvement',
    'distribution', 'customs', 'tooling', 'assembly', 'bom',
  ],
  consumer: [
    'consumer', 'retail', 'e-commerce', 'ecommerce', 'dtc', 'd2c', 'brand',
    'marketing', 'growth', 'customer', 'shopify', 'merchandis', 'packaging',
    'storefront', 'subscription', 'cpg', 'food', 'beverage', 'apparel',
    'fashion', 'marketplace', 'pricing', 'loyalty', 'point of sale',
    'direct to consumer',
  ],
  hardware: [
    'hardware', 'robot', 'mechanical', 'electrical', 'electronics', 'pcb',
    'firmware', 'embedded', 'sensor', 'actuator', 'cad', '3d print',
    'prototype', 'injection mold', 'machining', 'drone', 'iot', 'device',
    'wearable', 'motor', 'chip', 'semiconductor', 'silicon', 'mechatronic',
    'physical product',
  ],
};
