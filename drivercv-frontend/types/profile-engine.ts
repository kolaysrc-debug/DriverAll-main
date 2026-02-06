/**
 * ROUTE: /types/profile-engine.ts
 * DATE: 2026-01-26 16:10:00 GMT
 */

export type FieldType = "text" | "number" | "date" | "select" | "boolean" | "textarea" | "file";

export interface ProfileFieldDefinition {
  id: string;
  key: string;              
  label: string;            
  type: FieldType;
  section: "identity" | "business" | "contact" | "financial"; 
  role: string[];           
  countries: string[];      
  required: boolean;
  options?: string[];       
  order: number;            
  visibleIf?: {
    fieldKey: string;
    values: string[]; 
  };
}