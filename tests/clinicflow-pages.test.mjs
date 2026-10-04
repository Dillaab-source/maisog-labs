import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const pages = {
  privacy: read('../public/clinicflow/privacy.html'),
  deletion: read('../public/clinicflow/data-deletion.html'),
  terms: read('../public/clinicflow/terms.html'),
};

test('ClinicFlow pages are static public assets with shared mobile styling and current contact', () => {
  const wrangler = read('../wrangler.jsonc');
  const css = read('../public/clinicflow/legal.css');
  assert.match(wrangler, /"directory":\s*"\.\/out"/);
  assert.match(wrangler, /"html_handling":\s*"auto-trailing-slash"/);
  assert.doesNotMatch(wrangler, /clinicflow/i, 'ClinicFlow routes remain outside Worker-first/auth routing');
  assert.match(css, /@media\s*\(max-width:\s*560px\)/);
  for (const page of Object.values(pages)) {
    assert.match(page, /href="\/clinicflow\/legal\.css"/);
    assert.match(page, /Last updated: October 5, 2026/);
    assert.match(page, /maisoglabsclinicflow@gmail\.com/);
    assert.match(page, /<nav aria-label="ClinicFlow pages">/);
  }
});

test('production export contains all three extensionless ClinicFlow page assets', { skip: !existsSync(new URL('../out/clinicflow/privacy.html', import.meta.url)) }, () => {
  for (const [file, marker] of [
    ['privacy.html', 'ClinicFlow Privacy Policy'],
    ['data-deletion.html', 'ClinicFlow Data Deletion Instructions'],
    ['terms.html', 'ClinicFlow Terms of Service'],
  ]) {
    const html = readFileSync(new URL(`../out/clinicflow/${file}`, import.meta.url), 'utf8');
    assert.ok(html.includes(marker), `${file} missing expected title`);
    assert.ok(html.includes('maisoglabsclinicflow@gmail.com'), `${file} missing ClinicFlow contact`);
  }
  assert.ok(existsSync(new URL('../out/clinicflow/legal.css', import.meta.url)), 'shared mobile stylesheet missing from export');
});

test('privacy page matches the owner-approved ClinicFlow data and service-provider facts', () => {
  const page = pages.privacy;
  for (const term of [
    'Messenger', 'patient name', 'contact number', 'requested service', 'appointment date and time',
    'rescheduling', 'cancellation state', 'Google Calendar', 'Google Sheets', 'operational appointment records',
    'n8n', 'OpenAI', 'AI interpretation', 'verified against the scheduling provider', 'escalated to clinic staff',
    'legitimate operational, security, or legal reasons',
  ]) assert.ok(page.toLowerCase().includes(term.toLowerCase()), `privacy page missing: ${term}`);
  assert.match(page, /does not diagnose, give medical advice, or store full medical records/i);
  assert.match(page, /does not replace clinic staff, verify HMO eligibility, or process card payments/i);
  assert.doesNotMatch(page, /retain(?:ed|s)? (?:your )?data for \d+ (?:days|months|years)/i);
});

test('deletion page gives actionable steps and states the scope and legitimate exceptions', () => {
  const page = pages.deletion;
  for (const term of ['data deletion request', 'name used for the appointment', 'approximate appointment date', 'contact you to clarify', 'Google Calendar', 'Google Sheets', 'Meta', 'legitimate operational, security, or legal reasons']) {
    assert.ok(page.toLowerCase().includes(term.toLowerCase()), `deletion page missing: ${term}`);
  }
  assert.match(page, /does not promise a fixed retention period/i);
});

test('terms cover pilot use, appointment limits, safety, availability, third parties, and liability', () => {
  const page = pages.terms;
  for (const term of ['Acceptable use', 'does not diagnose', 'medical advice', 'clinic or provider is responsible', 'scheduling provider', 'reschedule or cancel', 'pilot', 'Meta Messenger', 'Google Calendar', 'n8n', 'OpenAI', 'Liability', 'applicable law']) {
    assert.ok(page.toLowerCase().includes(term.toLowerCase()), `terms page missing: ${term}`);
  }
});
