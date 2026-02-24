/**
 * RVF (RuVector Format) module for document intelligence
 *
 * This module provides TypeScript types and serialization functions
 * for the RVF binary format with document segment extensions.
 *
 * @module ruvector/rvf
 *
 * @example
 * ```typescript
 * import {
 *   SEGMENT_TYPES,
 *   DocumentSegment,
 *   serializeDocumentSegment,
 *   deserializeDocumentSegment,
 *   createDocumentBatch,
 * } from '@ruvector/rvf';
 *
 * // Create a document batch
 * const segments = createDocumentBatch('doc-123', chunks, docMeta);
 *
 * // Serialize to binary
 * const binary = serializeDocumentSegment(segments[0]);
 *
 * // Deserialize from binary
 * const restored = deserializeDocumentSegment(binary);
 * ```
 *
 * @see /plugins/ruvector/workflows/15-rvf-cognitive-containers.md
 */

// Segment type codes
export {
  SEGMENT_TYPES,
  type SegmentTypeCode,
  RVF_MAGIC,
  RVF_VERSION,
  DistanceMetric,
  type RVFHeader,
  type RVFRecord,
} from './document-segments.js';

// Document segment interfaces
export {
  type DocumentMetadata,
  type DocumentSegment,
  type ResultType,
  type DocumentSearchResult,
  SEGMENT_HEADER_SIZE,
  DEFAULT_DIMENSION,
} from './document-segments.js';

// Serialization functions
export {
  serializeDocumentSegment,
  deserializeDocumentSegment,
} from './document-segments.js';

// Batch operations
export {
  type ChunkData,
  createDocumentBatch,
  createVLMSegment,
  createOCRSegment,
} from './document-segments.js';

// Conversion utilities
export {
  toSearchResult,
  fromSearchResult,
} from './document-segments.js';

// COW (Copy-on-Write) branching
export {
  COW_SEGMENT_TYPES,
  type COWSegmentTypeCode,
  type VisibilityMode,
  type VisibilityFilter,
  type DeltaType,
  type DocumentDelta,
  type ClusterLocation,
  type COWClusterMap,
  type RefCountEntry,
  type COWBranch,
  type COWBranchStats,
} from './cow-document-branch.js';

// COW membership filter
export {
  createMembershipFilter,
  testMembership,
} from './cow-document-branch.js';

// COW serialization
export {
  serializeCOWBranch,
  deserializeCOWBranch,
  serializeDocumentDelta,
  serializeRefCounts,
  deserializeRefCounts,
} from './cow-document-branch.js';

// COW branch manager
export { COWBranchManager } from './cow-document-branch.js';

// COW utility functions
export {
  computeDeltaSize,
  createVisibilityFilter,
  mergeVisibilityFilters,
  checkVisibility,
  generateBranchId,
  createDelta,
} from './cow-document-branch.js';
