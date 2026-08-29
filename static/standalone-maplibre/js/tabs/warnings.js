/**
 * Tab 4: Bureau Warnings Screen View
 */

import { formatTime, formatDateShort } from '../utils/formatters.js';

export function renderWarningsTab(container, { warnings, location, onSelectWarning }) {
  if (!warnings || warnings.length === 0) {
    container.innerHTML = `
      <div class="warnings-container">
        <div class="card all-clear-card">
          <div class="all-clear-icon">✅</div>
          <h2>No Active Weather Warnings</h2>
          <p>There are currently no active severe weather or marine warnings for this area.</p>
        </div>
      </div>
    `;
    return;
  }

  // Filter or group warnings
  const localState = (location?.state || 'NSW').toUpperCase();
  const stateWarnings = warnings.filter(w => (w.state || '').toUpperCase() === localState);
  const otherWarnings = warnings.filter(w => (w.state || '').toUpperCase() !== localState);

  container.innerHTML = `
    <div class="warnings-container">
      <div class="warnings-banner">
        <h2>⚠️ Active Weather Warnings (${warnings.length})</h2>
        <p>Official Bureau of Meteorology warnings across Australia.</p>
      </div>

      ${stateWarnings.length > 0 ? `
        <div class="section-box">
          <h3 class="section-title">Warnings for ${localState} (${stateWarnings.length})</h3>
          <div class="warning-cards-list">
            ${stateWarnings.map(w => renderWarningCard(w)).join('')}
          </div>
        </div>
      ` : ''}

      <div class="section-box">
        <h3 class="section-title">National & Other State Warnings (${otherWarnings.length})</h3>
        <div class="warning-cards-list">
          ${otherWarnings.slice(0, 30).map(w => renderWarningCard(w)).join('')}
        </div>
      </div>
    </div>
  `;

  // Attach card click handlers for details
  container.querySelectorAll('.warning-card').forEach(card => {
    card.addEventListener('click', () => {
      const warnId = card.dataset.id;
      const warn = warnings.find(w => w.id === warnId);
      if (warn && onSelectWarning) onSelectWarning(warn);
    });
  });
}

function renderWarningCard(w) {
  const type = (w.type || 'warning').toLowerCase();
  let badgeClass = 'badge-yellow';
  let badgeText = 'ADVICE';

  if (type.includes('severe') || type.includes('flood') || type.includes('storm')) {
    badgeClass = 'badge-orange';
    badgeText = 'WARNING';
  }
  if (type.includes('emergency') || type.includes('cyclone') || type.includes('catastrophic')) {
    badgeClass = 'badge-red';
    badgeText = 'EMERGENCY';
  }
  if (type.includes('marine') || type.includes('wind') || type.includes('gale')) {
    badgeClass = 'badge-blue';
    badgeText = 'MARINE';
  }

  return `
    <div class="card warning-card" data-id="${w.id}">
      <div class="warning-card-header">
        <span class="warning-badge ${badgeClass}">${badgeText}</span>
        <span class="warning-state">${w.state || 'AUS'}</span>
      </div>
      <h3 class="warning-title">${w.title || w.short_title || 'Severe Weather Warning'}</h3>
      <p class="warning-summary-text">${w.short_title || 'Click to view full Bureau meteorological bulletin.'}</p>
      <div class="warning-meta">
        <span>Issued: ${w.issue_time ? formatTime(w.issue_time) : '--'}</span>
        ${w.expiry_time ? `<span>Expires: ${formatTime(w.expiry_time)}</span>` : ''}
      </div>
    </div>
  `;
}
