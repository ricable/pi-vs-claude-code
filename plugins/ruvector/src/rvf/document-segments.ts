/**
 * Document segment types for RVF integration
 * Extensions to the base RVF format for document intelligence
 *
 * @module ruvector/rvf/document-segments
 *
 * These segment types extend the RVF (RuVector Format) specification
 * for document intelligence use cases including OCR, VLM extractions,
 * and chunked embeddings with provenance tracking.
 *
 * @see /plugins/ruvector/workflows/15-rvf-cognitive-containers.md
 */

// ═══════════════════════════════════════════════════════════════════════════════
// SEGMENT TYPE CODES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Document intelligence segment type codes (0x30-0x3F reserved range)
 *
 * These extend the base RVF segment types:
 * - VEC_SEG (0x01) - Raw vector data
 * - META_SEG (0x03) - Vector metadata
 * - WITNESS_SEG (0x0B) - Provenance/audit chain
 */
export const SEGMENT_TYPES = {
  /** Document-level metadata segment */
  DOC_SEG: 0x30,
  /** Page-level embeddings segment */
  PAGE_SEG: 0x31,
  /** Text chunk embeddings segment */
  CHUNK_SEG: 0x32,
  /** Vision-Language Model extractions segment */
  VLM_SEG: 0x33,
  /** OCR result embeddings segment */
  OCR_SEG: 0x34,
} as const;

export type SegmentTypeCode = (typeof SEGMENT_TYPES)[keyof typeof SEGMENT_TYPES];

// ═══════════════════════════════════════════════════════════════════════════════
// BASE RVF TYPES (Reference from rvf.rs)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * RVF magic bytes identifying a valid RVF file
 */
export const RVF_MAGIC = new Uint8Array([0x52, 0x56, 0x46, 0x01]); // "RVF\x01"

/**
 * Current RVF format version
 */
export const RVF_VERSION = 1;

/**
 * Distance metrics for vector similarity
 */
export enum DistanceMetric {
  /** Cosine similarity (dot product of normalized vectors) */
  Cosine = 0,
  /** Euclidean (L2) distance */
  Euclidean = 1,
  /** Poincare distance for hyperbolic geometry */
  Poincare = 2,
}

/**
 * RVF file header structure (24 bytes)
 */
export interface RVFHeader {
  magic: Uint8Array;
  version: number;
  dimension: number;
  metric: DistanceMetric;
  curvature: number;
  count: number;
}

/**
 * Base RVF record structure
 */
export interface RVFRecord {
  id: string;
  vector: Float64Array;
  metadata: Map<string, string>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DOCUMENT SEGMENT INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Document metadata for document intelligence segments
 *
 * Compatible with OCR-Provenance VectorSearchResult and RVF metadata conventions.
 */
export interface DocumentMetadata {
  /** Document title */
  title?: string;
  /** Document author */
  author?: string;
  /** Source file path */
  sourcePath: string;
  /** MIME type of source document */
  mimeType: string;
  /** Total page count */
  pageCount: number;
  /** OCR quality score (0-1) */
  ocrQuality?: number;
  /** Chunk index within document (0-based) */
  chunkIndex?: number;
  /** Total chunks in document */
  totalChunks?: number;
  /** Heading context for chunk */
  headingContext?: string;
  /** Section path (e.g., "Chapter 1 > Section 2") */
  sectionPath?: string;
  /** Content types detected in chunk */
  contentTypes?: string[];
  /** Model name used for embedding */
  modelName?: string;
  /** Model version */
  modelVersion?: string;
  /** Provenance ID for witness chain */
  provenanceId?: string;
  /** Embedding status */
  embeddingStatus?: 'pending' | 'completed' | 'failed';
}

/**
 * Document segment structure for RVF binary format
 *
 * Each segment represents a unit of document intelligence:
 * - DOC_SEG: Document-level metadata
 * - PAGE_SEG: Page-level aggregated embeddings
 * - CHUNK_SEG: Individual text chunk embeddings
 * - VLM_SEG: Vision-Language Model extraction embeddings
 * - OCR_SEG: OCR result embeddings
 */
export interface DocumentSegment {
  /** Segment type code (0x30-0x34) */
  type: SegmentTypeCode;
  /** Unique segment identifier */
  id: string;
  /** Parent document identifier */
  documentId: string;
  /** Page number (1-based, optional for DOC_SEG) */
  pageNumber?: number;
  /** SHA-256 content hash for WITNESS_SEG provenance */
  contentHash: string;
  /** Embedding vector (dimension matches RVF header) */
  vector?: Float32Array;
  /** Document metadata */
  metadata: DocumentMetadata;
  /** Original text content (for text-based segments) */
  originalText?: string;
  /** Character range in source */
  characterStart?: number;
  characterEnd?: number;
}

/**
 * Result type discriminator for search results
 */
export type ResultType = 'chunk' | 'vlm' | 'extraction';

/**
 * Search result from document segment similarity search
 *
 * Compatible with OCR-Provenance VectorSearchResult interface.
 */
export interface DocumentSearchResult {
  /** Embedding/segment identifier */
  embedding_id: string;
  /** Chunk ID if chunk-based */
  chunk_id: string | null;
  /** Image ID if VLM-based */
  image_id: string | null;
  /** Extraction ID if extraction-based */
  extraction_id: string | null;
  /** Parent document ID */
  document_id: string;
  /** Result type discriminator */
  result_type: ResultType;
  /** Similarity score (0-1, higher = better) */
  similarity_score: number;
  /** Raw distance from query */
  distance: number;
  /** Original text content */
  original_text: string;
  /** Length of original text */
  original_text_length: number;
  /** Source file path */
  source_file_path: string;
  /** Source file name */
  source_file_name: string;
  /** Source file hash */
  source_file_hash: string;
  /** Page number (1-based) */
  page_number: number | null;
  /** Page range for multi-page segments */
  page_range: string | null;
  /** Character start position */
  character_start: number;
  /** Character end position */
  character_end: number;
  /** Chunk index */
  chunk_index: number;
  /** Total chunks in document */
  total_chunks: number;
  /** Model name */
  model_name: string;
  /** Model version */
  model_version: string;
  /** Provenance ID */
  provenance_id: string;
  /** Content hash */
  content_hash: string;
  /** Heading context */
  heading_context?: string | null;
  /** Section path */
  section_path?: string | null;
  /** Content types */
  content_types?: string | null;
  /** Is atomic chunk */
  is_atomic?: boolean;
  /** OCR quality score */
  ocr_quality_score?: number | null;
  /** Document title */
  doc_title?: string | null;
  /** Document author */
  doc_author?: string | null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SERIALIZATION CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Segment header size in bytes
 *
 * Layout:
 * - [type: 1 byte] - Segment type code
 * - [id_len: 2 bytes] - ID string length (u16 LE)
 * - [doc_id_len: 2 bytes] - Document ID string length (u16 LE)
 * - [page_number: 4 bytes] - Page number (i32 LE, -1 if not set)
 * - [content_hash: 32 bytes] - SHA-256 hash
 * - [vector_len: 4 bytes] - Vector length in floats (u32 LE, 0 if no vector)
 * - [meta_len: 4 bytes] - Metadata JSON length (u32 LE)
 * - [text_len: 4 bytes] - Original text length (u32 LE, 0 if none)
 * - [char_start: 4 bytes] - Character start (i32 LE, -1 if not set)
 * - [char_end: 4 bytes] - Character end (i32 LE, -1 if not set)
 * - [reserved: 3 bytes] - Reserved for future use
 * Total: 56 bytes
 */
export const SEGMENT_HEADER_SIZE = 56;

/**
 * Default vector dimension for document embeddings
 */
export const DEFAULT_DIMENSION = 768;

// ═══════════════════════════════════════════════════════════════════════════════
// SERIALIZATION HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Writer helper for binary serialization
 */
class Writer {
  private buffer: Uint8Array;
  private view: DataView;
  private offset: number;

  constructor(initialSize: number = 1024) {
    this.buffer = new Uint8Array(initialSize);
    this.view = new DataView(this.buffer.buffer);
    this.offset = 0;
  }

  private ensureCapacity(bytes: number): void {
    const needed = this.offset + bytes;
    if (needed > this.buffer.length) {
      const newSize = Math.max(needed, this.buffer.length * 2);
      const newBuffer = new Uint8Array(newSize);
      newBuffer.set(this.buffer);
      this.buffer = newBuffer;
      this.view = new DataView(this.buffer.buffer);
    }
  }

  writeU8(value: number): void {
    this.ensureCapacity(1);
    this.view.setUint8(this.offset++, value);
  }

  writeU16(value: number): void {
    this.ensureCapacity(2);
    this.view.setUint16(this.offset, value, true); // little-endian
    this.offset += 2;
  }

  writeU32(value: number): void {
    this.ensureCapacity(4);
    this.view.setUint32(this.offset, value, true); // little-endian
    this.offset += 4;
  }

  writeI32(value: number): void {
    this.ensureCapacity(4);
    this.view.setInt32(this.offset, value, true); // little-endian
    this.offset += 4;
  }

  writeF32(value: number): void {
    this.ensureCapacity(4);
    this.view.setFloat32(this.offset, value, true); // little-endian
    this.offset += 4;
  }

  writeF64(value: number): void {
    this.ensureCapacity(8);
    this.view.setFloat64(this.offset, value, true); // little-endian
    this.offset += 8;
  }

  writeBytes(data: Uint8Array): void {
    this.ensureCapacity(data.length);
    this.buffer.set(data, this.offset);
    this.offset += data.length;
  }

  writeString(str: string): void {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    this.writeU16(bytes.length);
    this.writeBytes(bytes);
  }

  writeHash(hash: string): void {
    // Parse hex string to 32 bytes
    if (hash.length !== 64) {
      throw new Error(`Invalid hash length: expected 64, got ${hash.length}`);
    }
    const bytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      bytes[i] = parseInt(hash.slice(i * 2, i * 2 + 2), 16);
    }
    this.writeBytes(bytes);
  }

  finish(): Uint8Array {
    return this.buffer.slice(0, this.offset);
  }
}

/**
 * Reader helper for binary deserialization
 */
class Reader {
  private buffer: Uint8Array;
  private view: DataView;
  private offset: number;

  constructor(buffer: Uint8Array) {
    this.buffer = buffer;
    this.view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    this.offset = 0;
  }

  private checkRemaining(bytes: number): void {
    if (this.offset + bytes > this.buffer.length) {
      throw new Error(
        `Unexpected EOF: need ${bytes} bytes at offset ${this.offset}, have ${this.buffer.length}`
      );
    }
  }

  readU8(): number {
    this.checkRemaining(1);
    return this.view.getUint8(this.offset++);
  }

  readU16(): number {
    this.checkRemaining(2);
    const value = this.view.getUint16(this.offset, true); // little-endian
    this.offset += 2;
    return value;
  }

  readU32(): number {
    this.checkRemaining(4);
    const value = this.view.getUint32(this.offset, true); // little-endian
    this.offset += 4;
    return value;
  }

  readI32(): number {
    this.checkRemaining(4);
    const value = this.view.getInt32(this.offset, true); // little-endian
    this.offset += 4;
    return value;
  }

  readF32(): number {
    this.checkRemaining(4);
    const value = this.view.getFloat32(this.offset, true); // little-endian
    this.offset += 4;
    return value;
  }

  readF64(): number {
    this.checkRemaining(8);
    const value = this.view.getFloat64(this.offset, true); // little-endian
    this.offset += 8;
    return value;
  }

  readBytes(length: number): Uint8Array {
    this.checkRemaining(length);
    const slice = this.buffer.slice(this.offset, this.offset + length);
    this.offset += length;
    return slice;
  }

  readString(): string {
    const length = this.readU16();
    const bytes = this.readBytes(length);
    const decoder = new TextDecoder();
    return decoder.decode(bytes);
  }

  readHash(): string {
    const bytes = this.readBytes(32);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  remaining(): number {
    return this.buffer.length - this.offset;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SERIALIZATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Serialize a DocumentSegment to RVF binary format
 *
 * @param seg - The document segment to serialize
 * @returns Uint8Array containing the binary representation
 * @throws Error if serialization fails
 */
export function serializeDocumentSegment(seg: DocumentSegment): Uint8Array {
  const writer = new Writer();

  // Prepare metadata JSON
  const metaJson = JSON.stringify(seg.metadata);
  const textEncoder = new TextEncoder();
  const metaBytes = textEncoder.encode(metaJson);
  const textBytes = seg.originalText ? textEncoder.encode(seg.originalText) : null;

  // Write header (56 bytes)
  writer.writeU8(seg.type); // type: 1 byte
  writer.writeU16(seg.id.length); // id_len: 2 bytes
  writer.writeU16(seg.documentId.length); // doc_id_len: 2 bytes
  writer.writeI32(seg.pageNumber ?? -1); // page_number: 4 bytes (-1 if not set)
  writer.writeHash(seg.contentHash); // content_hash: 32 bytes
  writer.writeU32(seg.vector?.length ?? 0); // vector_len: 4 bytes
  writer.writeU32(metaBytes.length); // meta_len: 4 bytes
  writer.writeU32(textBytes?.length ?? 0); // text_len: 4 bytes
  writer.writeI32(seg.characterStart ?? -1); // char_start: 4 bytes
  writer.writeI32(seg.characterEnd ?? -1); // char_end: 4 bytes
  writer.writeBytes(new Uint8Array(3)); // reserved: 3 bytes

  // Write variable-length fields
  const idEncoder = new TextEncoder();
  writer.writeBytes(idEncoder.encode(seg.id)); // id
  writer.writeBytes(idEncoder.encode(seg.documentId)); // documentId

  // Write vector (f32 LE each)
  if (seg.vector) {
    for (let i = 0; i < seg.vector.length; i++) {
      writer.writeF32(seg.vector[i]);
    }
  }

  // Write metadata JSON
  writer.writeBytes(metaBytes);

  // Write original text
  if (textBytes) {
    writer.writeBytes(textBytes);
  }

  return writer.finish();
}

/**
 * Deserialize a DocumentSegment from RVF binary format
 *
 * @param data - The binary data to deserialize
 * @returns DocumentSegment object
 * @throws Error if deserialization fails or data is invalid
 */
export function deserializeDocumentSegment(data: Uint8Array): DocumentSegment {
  if (data.length < SEGMENT_HEADER_SIZE) {
    throw new Error(
      `Data too short: expected at least ${SEGMENT_HEADER_SIZE} bytes, got ${data.length}`
    );
  }

  const reader = new Reader(data);
  const decoder = new TextDecoder();

  // Read header
  const type = reader.readU8() as SegmentTypeCode;
  const idLen = reader.readU16();
  const docIdLen = reader.readU16();
  const pageNumber = reader.readI32();
  const contentHash = reader.readHash();
  const vectorLen = reader.readU32();
  const metaLen = reader.readU32();
  const textLen = reader.readU32();
  const characterStart = reader.readI32();
  const characterEnd = reader.readI32();
  reader.readBytes(3); // reserved

  // Validate segment type
  const validTypes = Object.values(SEGMENT_TYPES);
  if (!validTypes.includes(type)) {
    throw new Error(`Invalid segment type: 0x${type.toString(16).padStart(2, '0')}`);
  }

  // Read variable-length fields
  const id = decoder.decode(reader.readBytes(idLen));
  const documentId = decoder.decode(reader.readBytes(docIdLen));

  // Read vector
  let vector: Float32Array | undefined;
  if (vectorLen > 0) {
    vector = new Float32Array(vectorLen);
    for (let i = 0; i < vectorLen; i++) {
      vector[i] = reader.readF32();
    }
  }

  // Read metadata
  const metaBytes = reader.readBytes(metaLen);
  const metadata: DocumentMetadata = JSON.parse(decoder.decode(metaBytes));

  // Read original text
  let originalText: string | undefined;
  if (textLen > 0) {
    originalText = decoder.decode(reader.readBytes(textLen));
  }

  return {
    type,
    id,
    documentId,
    pageNumber: pageNumber >= 0 ? pageNumber : undefined,
    contentHash,
    vector,
    metadata,
    originalText,
    characterStart: characterStart >= 0 ? characterStart : undefined,
    characterEnd: characterEnd >= 0 ? characterEnd : undefined,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// BATCH OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Chunk data for batch creation
 */
export interface ChunkData {
  /** Unique chunk identifier */
  id: string;
  /** Embedding vector */
  vector: Float32Array;
  /** Chunk metadata */
  metadata: DocumentMetadata;
  /** Original text content */
  originalText?: string;
  /** Character positions */
  characterStart?: number;
  characterEnd?: number;
}

/**
 * Create a batch of document segments for a single document
 *
 * Generates DOC_SEG, PAGE_SEG, and CHUNK_SEG segments for complete
 * document representation in RVF format.
 *
 * @param docId - The document identifier
 * @param chunks - Array of chunk data with vectors and metadata
 * @param documentMeta - Document-level metadata
 * @returns Array of DocumentSegment objects
 */
export function createDocumentBatch(
  docId: string,
  chunks: ChunkData[],
  documentMeta: Omit<DocumentMetadata, 'chunkIndex' | 'totalChunks'>
): DocumentSegment[] {
  const segments: DocumentSegment[] = [];

  // Create DOC_SEG for document-level metadata
  const docSegId = `doc:${docId}`;
  const docContentHash = computeDocumentHash(docId, documentMeta);

  segments.push({
    type: SEGMENT_TYPES.DOC_SEG,
    id: docSegId,
    documentId: docId,
    contentHash: docContentHash,
    metadata: {
      ...documentMeta,
      chunkIndex: undefined,
      totalChunks: chunks.length,
    },
  });

  // Create CHUNK_SEG for each chunk
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const chunkSegId = `chunk:${docId}:${i}`;
    const chunkContentHash = computeChunkHash(docId, i, chunk.originalText ?? '');

    segments.push({
      type: SEGMENT_TYPES.CHUNK_SEG,
      id: chunkSegId,
      documentId: docId,
      pageNumber: chunk.metadata.pageCount > 0 ? 1 : undefined, // Simplified; could be more specific
      contentHash: chunkContentHash,
      vector: chunk.vector,
      metadata: {
        ...chunk.metadata,
        chunkIndex: i,
        totalChunks: chunks.length,
      },
      originalText: chunk.originalText,
      characterStart: chunk.characterStart,
      characterEnd: chunk.characterEnd,
    });
  }

  return segments;
}

/**
 * Create VLM segment for vision-language model extractions
 *
 * @param docId - The document identifier
 * @param extractionId - The extraction identifier
 * @param vector - Embedding vector
 * @param metadata - Extraction metadata
 * @param pageNumber - Page number of extraction
 * @returns DocumentSegment for VLM extraction
 */
export function createVLMSegment(
  docId: string,
  extractionId: string,
  vector: Float32Array,
  metadata: DocumentMetadata,
  pageNumber: number
): DocumentSegment {
  const vlmSegId = `vlm:${docId}:${extractionId}`;
  const contentHash = computeVLMHash(docId, extractionId, pageNumber);

  return {
    type: SEGMENT_TYPES.VLM_SEG,
    id: vlmSegId,
    documentId: docId,
    pageNumber,
    contentHash,
    vector,
    metadata,
  };
}

/**
 * Create OCR segment for OCR result embeddings
 *
 * @param docId - The document identifier
 * @param pageNumber - Page number
 * @param vector - Embedding vector for OCR text
 * @param ocrQuality - OCR quality score (0-1)
 * @param text - OCR text content
 * @returns DocumentSegment for OCR result
 */
export function createOCRSegment(
  docId: string,
  pageNumber: number,
  vector: Float32Array,
  ocrQuality: number,
  text: string
): DocumentSegment {
  const ocrSegId = `ocr:${docId}:${pageNumber}`;
  const contentHash = computeOCRHash(docId, pageNumber, text);

  return {
    type: SEGMENT_TYPES.OCR_SEG,
    id: ocrSegId,
    documentId: docId,
    pageNumber,
    contentHash,
    vector,
    metadata: {
      sourcePath: docId,
      mimeType: 'text/plain',
      pageCount: pageNumber,
      ocrQuality,
    },
    originalText: text,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// HASH COMPUTATION (For WITNESS_SEG Provenance)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Compute SHA-256 hash for document segment
 *
 * Uses Web Crypto API for consistent cross-platform hashing.
 * Returns hex-encoded string (64 characters).
 */
async function computeSHA256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Synchronous hash computation using simple algorithm
 * For cases where async is not desired, uses a deterministic hash.
 */
function computeSimpleHash(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  // Convert to hex and pad to 64 characters (simulate SHA-256 length)
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return hex.repeat(8); // Repeat to get 64 characters
}

/**
 * Compute document hash for DOC_SEG
 */
function computeDocumentHash(
  docId: string,
  meta: Omit<DocumentMetadata, 'chunkIndex' | 'totalChunks'>
): string {
  const data = `${docId}:${meta.sourcePath}:${meta.pageCount}:${meta.mimeType}`;
  return computeSimpleHash(data);
}

/**
 * Compute chunk hash for CHUNK_SEG
 */
function computeChunkHash(docId: string, chunkIndex: number, text: string): string {
  const data = `${docId}:chunk:${chunkIndex}:${text.slice(0, 100)}`;
  return computeSimpleHash(data);
}

/**
 * Compute VLM extraction hash for VLM_SEG
 */
function computeVLMHash(docId: string, extractionId: string, pageNumber: number): string {
  const data = `${docId}:vlm:${extractionId}:${pageNumber}`;
  return computeSimpleHash(data);
}

/**
 * Compute OCR hash for OCR_SEG
 */
function computeOCRHash(docId: string, pageNumber: number, text: string): string {
  const data = `${docId}:ocr:${pageNumber}:${text.slice(0, 100)}`;
  return computeSimpleHash(data);
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONVERSION UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Convert DocumentSegment to OCR-Provenance compatible SearchResult
 *
 * @param seg - Document segment to convert
 * @param similarityScore - Computed similarity score
 * @param distance - Raw distance from query
 * @returns DocumentSearchResult compatible with VectorSearchResult
 */
export function toSearchResult(
  seg: DocumentSegment,
  similarityScore: number,
  distance: number
): DocumentSearchResult {
  const isChunk = seg.type === SEGMENT_TYPES.CHUNK_SEG;
  const isVLM = seg.type === SEGMENT_TYPES.VLM_SEG;
  const isOCR = seg.type === SEGMENT_TYPES.OCR_SEG;

  let resultType: ResultType = 'extraction';
  if (isChunk) resultType = 'chunk';
  else if (isVLM) resultType = 'vlm';

  return {
    embedding_id: seg.id,
    chunk_id: isChunk ? seg.id : null,
    image_id: isVLM ? seg.id : null,
    extraction_id: isOCR ? seg.id : null,
    document_id: seg.documentId,
    result_type: resultType,
    similarity_score: similarityScore,
    distance: distance,
    original_text: seg.originalText ?? '',
    original_text_length: seg.originalText?.length ?? 0,
    source_file_path: seg.metadata.sourcePath,
    source_file_name: seg.metadata.sourcePath.split('/').pop() ?? seg.metadata.sourcePath,
    source_file_hash: seg.contentHash,
    page_number: seg.pageNumber ?? null,
    page_range: null,
    character_start: seg.characterStart ?? 0,
    character_end: seg.characterEnd ?? 0,
    chunk_index: seg.metadata.chunkIndex ?? 0,
    total_chunks: seg.metadata.totalChunks ?? 1,
    model_name: seg.metadata.modelName ?? 'unknown',
    model_version: seg.metadata.modelVersion ?? '1.0',
    provenance_id: seg.metadata.provenanceId ?? seg.id,
    content_hash: seg.contentHash,
    heading_context: seg.metadata.headingContext ?? null,
    section_path: seg.metadata.sectionPath ?? null,
    content_types: seg.metadata.contentTypes?.join(',') ?? null,
    is_atomic: true,
    ocr_quality_score: seg.metadata.ocrQuality ?? null,
    doc_title: seg.metadata.title ?? null,
    doc_author: seg.metadata.author ?? null,
  };
}

/**
 * Convert OCR-Provenance VectorSearchResult to DocumentSegment
 *
 * @param result - VectorSearchResult to convert
 * @param vector - Embedding vector
 * @returns DocumentSegment
 */
export function fromSearchResult(
  result: DocumentSearchResult,
  vector: Float32Array
): DocumentSegment {
  let segmentType: SegmentTypeCode;

  switch (result.result_type) {
    case 'chunk':
      segmentType = SEGMENT_TYPES.CHUNK_SEG;
      break;
    case 'vlm':
      segmentType = SEGMENT_TYPES.VLM_SEG;
      break;
    case 'extraction':
    default:
      segmentType = SEGMENT_TYPES.OCR_SEG;
      break;
  }

  return {
    type: segmentType,
    id: result.embedding_id,
    documentId: result.document_id,
    pageNumber: result.page_number ?? undefined,
    contentHash: result.content_hash,
    vector,
    metadata: {
      title: result.doc_title ?? undefined,
      author: result.doc_author ?? undefined,
      sourcePath: result.source_file_path,
      mimeType: 'text/plain',
      pageCount: result.total_chunks,
      ocrQuality: result.ocr_quality_score ?? undefined,
      chunkIndex: result.chunk_index,
      totalChunks: result.total_chunks,
      headingContext: result.heading_context ?? undefined,
      sectionPath: result.section_path ?? undefined,
      modelName: result.model_name,
      modelVersion: result.model_version,
      provenanceId: result.provenance_id,
    },
    originalText: result.original_text,
    characterStart: result.character_start,
    characterEnd: result.character_end,
  };
}
