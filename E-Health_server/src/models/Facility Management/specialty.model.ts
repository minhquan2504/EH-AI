/**
 * Interface specialties.
 */
export interface Specialty {
    specialties_id: string;
    code: string;
    name: string;
    description: string | null;
}

/**
 * Payload
 */
export interface SpecialtyPayloadDTO {
    code: string;
    name: string;
    description?: string;
}