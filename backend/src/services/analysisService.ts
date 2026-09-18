import { AnalysisResult } from '../types/index.js';

/**
 * Interface defining the contract for AI triage services.
 * In Phase 6, a BedrockAnalysisService implementing this interface
 * will replace MockAnalysisService without modifying handlers.
 */
export interface AnalysisService {
  analyze(description: string, location?: string): Promise<AnalysisResult>;
}

/**
 * Local deterministic analysis service for local testing and validation.
 */
export class MockAnalysisService implements AnalysisService {
  async analyze(description: string, _location?: string): Promise<AnalysisResult> {
    const lower = description.toLowerCase();

    // 1. Electrical Hazard (CRITICAL)
    if (
      (lower.includes('smoke') && (lower.includes('electrical') || lower.includes('panel') || lower.includes('wire'))) ||
      lower.includes('spark') ||
      lower.includes('short circuit') ||
      lower.includes('shock') ||
      lower.includes('exposed wire')
    ) {
      return {
        category: 'Electrical Safety',
        priority: 'CRITICAL',
        summary: 'Smoke, sparks, or exposed electrical hazard detected in campus facility.',
        recommendedAction:
          'Move away from the affected area immediately and notify campus emergency or electrical maintenance personnel. Do not attempt electrical repairs or touch any wiring.',
        department: 'Campus Safety & Electrical Maintenance',
      };
    }

    // 2. Active Fire or Hazardous Gas (CRITICAL)
    if (
      lower.includes('fire') ||
      lower.includes('flame') ||
      lower.includes('burning') ||
      lower.includes('gas leak') ||
      lower.includes('explosion')
    ) {
      return {
        category: 'Fire / Hazard',
        priority: 'CRITICAL',
        summary: 'Active fire, smoke, or combustible hazard reported.',
        recommendedAction:
          'Move away from the affected area immediately. Follow campus evacuation procedures and alert emergency personnel or pull the nearest fire alarm.',
        department: 'Campus Emergency & Fire Safety',
      };
    }

    // 3. Plumbing / Water Leak (LOW - MEDIUM)
    if (
      lower.includes('water') ||
      lower.includes('tap') ||
      lower.includes('leak') ||
      lower.includes('pipe') ||
      lower.includes('plumbing') ||
      lower.includes('drain')
    ) {
      const isSevere = lower.includes('flood') || lower.includes('heavy') || lower.includes('burst');
      return {
        category: 'Plumbing & Water',
        priority: isSevere ? 'MEDIUM' : 'LOW',
        summary: isSevere
          ? 'Significant water leak or plumbing overflow reported.'
          : 'Minor plumbing maintenance issue (e.g. leaking fixture) reported.',
        recommendedAction:
          'Avoid contact with pooled water near electrical fixtures. Facilities maintenance will inspect and repair the plumbing line.',
        department: 'Campus Facilities & Plumbing Maintenance',
      };
    }

    // 4. Lost ID Card or Credential (LOW / MEDIUM)
    if (
      lower.includes('lost id') ||
      lower.includes('lost my id') ||
      lower.includes('id card') ||
      lower.includes('identity card') ||
      lower.includes('student card') ||
      lower.includes('lost card')
    ) {
      return {
        category: 'Security & Access',
        priority: 'LOW',
        summary: 'Student identification card reported lost on campus.',
        recommendedAction:
          'Report the lost ID to the campus security desk or student affairs office to request temporary access and card deactivation.',
        department: 'Student Affairs & Campus Security',
      };
    }

    // 5. Security Incident / Theft / Dispute (HIGH) - Objective wording, no accusation of guilt
    if (
      lower.includes('stole') ||
      lower.includes('stolen') ||
      lower.includes('theft') ||
      lower.includes('fight') ||
      lower.includes('harass') ||
      lower.includes('threat') ||
      lower.includes('intruder')
    ) {
      return {
        category: 'Security & Access',
        priority: 'HIGH',
        summary: 'Security incident involving reported loss, dispute, or disturbance.',
        recommendedAction:
          'Move to a safe location if needed and report the incident to campus security personnel. Avoid personal confrontation.',
        department: 'Campus Security & Proctorial Board',
      };
    }

    // 6. Accessibility & Mobility Barriers (HIGH)
    if (
      lower.includes('wheelchair') ||
      lower.includes('ramp') ||
      lower.includes('accessibility') ||
      lower.includes('braille') ||
      lower.includes('elevator broken') ||
      lower.includes('lift stuck')
    ) {
      return {
        category: 'Accessibility & Mobility',
        priority: 'HIGH',
        summary: 'Campus accessibility barrier or mobility asset outage reported.',
        recommendedAction:
          'Campus accessibility team notified to coordinate immediate alternate transit route and urgent lift repair.',
        department: 'Campus Accessibility & Inclusion Services',
      };
    }

    // 7. Hostel / Residential Life (MEDIUM)
    if (
      lower.includes('hostel') ||
      lower.includes('dorm') ||
      lower.includes('room lock') ||
      lower.includes('warden') ||
      lower.includes('mess')
    ) {
      return {
        category: 'Hostel & Residential Life',
        priority: 'MEDIUM',
        summary: 'Residential facility or student accommodation issue reported.',
        recommendedAction:
          'Notify your hostel warden or residential supervisor for logbook entry and facilities follow-up.',
        department: 'Hostel Administration & Student Housing',
      };
    }

    // 8. General Maintenance / Structural (LOW)
    if (
      lower.includes('broken') ||
      lower.includes('door') ||
      lower.includes('window') ||
      lower.includes('light') ||
      lower.includes('fan') ||
      lower.includes('ac') ||
      lower.includes('air conditioning') ||
      lower.includes('chair') ||
      lower.includes('desk')
    ) {
      return {
        category: 'Infrastructure & Maintenance',
        priority: 'LOW',
        summary: 'General facility fixture or classroom infrastructure maintenance required.',
        recommendedAction:
          'Exercise caution around damaged equipment until maintenance staff completes servicing.',
        department: 'Campus Facilities & Civil Maintenance',
      };
    }

    // 9. Generic Fallback Support (MEDIUM)
    return {
      category: 'General Campus Support',
      priority: 'MEDIUM',
      summary: 'Campus support inquiry submitted for administrative assessment.',
      recommendedAction:
        'Campus support coordinators will review this report and route it to the designated department.',
      department: 'Campus General Administration',
    };
  }
}

// Singleton default instance
export const defaultAnalysisService = new MockAnalysisService();
