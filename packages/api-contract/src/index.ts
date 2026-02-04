/**
 * @sfi-fea/api-contract
 *
 * This package will contain:
 * 1. OpenAPI specification for the SFI-FEA API
 * 2. Generated TypeScript client for API consumption
 * 3. Contract testing utilities
 *
 * TODO: Implement the following:
 * - OpenAPI 3.1 specification
 * - Client generation using openapi-typescript-codegen or similar
 * - Contract validation utilities
 */

export const API_VERSION = '1.0.0';
export const API_BASE_PATH = '/api/v1';

/**
 * API endpoint definitions (placeholder)
 * These will be generated from OpenAPI spec
 */
export const endpoints = {
  deals: {
    list: `${API_BASE_PATH}/deals`,
    create: `${API_BASE_PATH}/deals`,
    get: (id: string) => `${API_BASE_PATH}/deals/${id}`,
    update: (id: string) => `${API_BASE_PATH}/deals/${id}`,
    delete: (id: string) => `${API_BASE_PATH}/deals/${id}`,
    participants: {
      list: (dealId: string) => `${API_BASE_PATH}/deals/${dealId}/participants`,
      create: (dealId: string) => `${API_BASE_PATH}/deals/${dealId}/participants`,
    },
  },
  // TODO: Add more endpoint definitions as the API grows
} as const;
