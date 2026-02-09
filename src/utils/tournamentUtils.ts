import { Tournament } from '../types';

/**
 * Calculate the current status of a tournament based on its start and end dates
 */
export const calculateTournamentStatus = (tournament: Tournament): 'ongoing' | 'upcoming' | 'completed' => {
  const now = new Date();
  const startDate = new Date(tournament.startDate);
  const endDate = new Date(tournament.endDate);

  if (now > endDate) {
    return 'completed';
  }

  if (now >= startDate && now <= endDate) {
    return 'ongoing';
  }

  return 'upcoming';
};

/**
 * Calculate the registration status of a tournament
 */
export const calculateRegistrationStatus = (tournament: Tournament): 'open' | 'closed' | 'not_started' => {
  const now = new Date();

  // For completed tournaments, registration is always closed
  const tournamentStatus = calculateTournamentStatus(tournament);
  if (tournamentStatus === 'completed') {
    return 'closed';
  }

  // For ongoing tournaments, use simple logic based on tournament status
  if (tournamentStatus === 'ongoing') {
    return 'closed'; // Usually registration closes when tournament starts
  }

  // For upcoming tournaments, check registration dates if available
  if (!tournament.registrationStartDate && !tournament.registrationEndDate) {
    // If no registration dates specified, assume open for upcoming tournaments
    return tournamentStatus === 'upcoming' ? 'open' : 'closed';
  }

  const regStartDate = tournament.registrationStartDate ? new Date(tournament.registrationStartDate) : null;
  const regEndDate = tournament.registrationEndDate ? new Date(tournament.registrationEndDate) : null;

  // If registration hasn't started yet
  if (regStartDate && now < regStartDate) {
    return 'not_started';
  }

  // If registration has ended
  if (regEndDate && now > regEndDate) {
    return 'closed';
  }

  // If we're within the registration period
  if ((!regStartDate || now >= regStartDate) && (!regEndDate || now <= regEndDate)) {
    return 'open';
  }

  return 'closed';
};

/**
 * Format tournament field value as JSON for storage in user_tournament_field_values table
 * The value field must be a valid JSON object with field_type as key
 *
 * Single field: {"field_type": "user_value"}
 * Multiple fields: {"field_type_1": "value_1", "field_type_2": "value_2"}
 */
export const formatTournamentFieldValueAsJson = (
  fieldType: string,
  value: string
): Record<string, string> => {
  try {
    // Create JSON object with field_type as key and user value as value
    const jsonObject = {
      [fieldType]: value
    };

    // Return the JSON object directly (Supabase will handle serialization)
    return jsonObject;
  } catch (error) {
    console.error('Error formatting tournament field value as JSON:', error);
    throw new Error(`Failed to format value for field type "${fieldType}": ${error.message}`);
  }
};

/**
 * Format multiple tournament field values as a single JSON object
 * Used when multiple fields need to be combined into one value entry
 */
export const formatMultipleTournamentFieldsAsJson = (
  fields: Array<{ fieldType: string; value: string }>
): Record<string, string> => {
  try {
    // Create JSON object with all field types as keys
    const jsonObject: Record<string, string> = {};

    fields.forEach(field => {
      if (field.value && field.value.trim() !== '') {
        jsonObject[field.fieldType] = field.value;
      }
    });

    // Return the JSON object directly (Supabase will handle serialization)
    return jsonObject;
  } catch (error) {
    console.error('Error formatting multiple tournament fields as JSON:', error);
    throw new Error(`Failed to format multiple fields: ${error.message}`);
  }
};

/**
 * Parse tournament field value from JSON format
 * Handles both old plain-text format and new JSON format for backward compatibility
 */
export const parseTournamentFieldValueFromJson = (
  jsonString: string
): Record<string, string> | string => {
  try {
    // Try to parse as JSON
    const parsed = JSON.parse(jsonString);

    // If it's an object, return it
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed;
    }

    // If it's a string (old format), return as-is
    return parsed;
  } catch (error) {
    // If JSON parsing fails, assume it's old plain-text format
    console.warn('Failed to parse tournament field value as JSON, assuming plain text:', error);
    return jsonString;
  }
};
