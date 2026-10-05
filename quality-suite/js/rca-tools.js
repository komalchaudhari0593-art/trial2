/**
 * JOST Quality Suite — RCA (Root Cause Analysis) Tools Engine
 * Handles 5W2H Problem Framing, IS / IS NOT Matrix, Dual-Chain 5-Why, and Ishikawa 6M Matrix.
 */

(function (window) {
  'use strict';

  const RcaTools = {
    // 1. 5W2H Problem Framing
    get5W2HData(report) {
      return report?.d2_data_5w2h || {};
    },

    save5W2H(report, fields) {
      report.d2_data_5w2h = {
        who: fields.who || '',
        what: fields.what || '',
        where: fields.where || '',
        when: fields.when || '',
        why: fields.why || '',
        how: fields.how || '',
        howmany: fields.howmany || ''
      };

      const formatted = [
        `[5W2H Problem Statement Formulation]`,
        `• WHO: ${fields.who || '-'}`,
        `• WHAT: ${fields.what || '-'}`,
        `• WHERE: ${fields.where || '-'}`,
        `• WHEN: ${fields.when || '-'}`,
        `• WHY: ${fields.why || '-'}`,
        `• HOW: ${fields.how || '-'}`,
        `• HOW MANY: ${fields.howmany || '-'}`
      ].join('\n');

      return formatted;
    },

    // 2. IS / IS NOT Comparative Problem Analysis
    getIsIsNotData(report) {
      return report?.d2_data_isnot || {};
    },

    saveIsIsNot(report, dimensions) {
      report.d2_data_isnot = dimensions;

      const formatted = [
        `[IS / IS NOT Comparative Matrix]`,
        `• WHAT: IS [${dimensions.what_is || '-'}] | IS NOT [${dimensions.what_isnot || '-'}] | DIFF: [${dimensions.what_diff || '-'}]`,
        `• WHERE: IS [${dimensions.where_is || '-'}] | IS NOT [${dimensions.where_isnot || '-'}] | DIFF: [${dimensions.where_diff || '-'}]`,
        `• WHEN: IS [${dimensions.when_is || '-'}] | IS NOT [${dimensions.when_isnot || '-'}] | DIFF: [${dimensions.when_diff || '-'}]`,
        `• EXTENT: IS [${dimensions.extent_is || '-'}] | IS NOT [${dimensions.extent_isnot || '-'}] | DIFF: [${dimensions.extent_diff || '-'}]`
      ].join('\n');

      return formatted;
    },

    // 3. Dual-Chain Multi 5-Why Engine
    add5WhyChain(report, chainData) {
      if (!report.d4_data_5why) report.d4_data_5why = {};
      if (!Array.isArray(report.d4_data_5why.chains)) report.d4_data_5why.chains = [];

      const newChain = {
        id: 'chain_' + Date.now() + '_' + Math.floor(Math.random() * 100),
        title: chainData.title || (chainData.type === 'occ' ? 'Occurrence Cause Chain' : 'Escape Cause Chain'),
        type: chainData.type || 'occ', // 'occ' = Why made? | 'esc' = Why shipped / undetected?
        is_real_root_cause: chainData.is_real_root_cause !== false,
        why1: chainData.why1 || '',
        why2: chainData.why2 || '',
        why3: chainData.why3 || '',
        why4: chainData.why4 || '',
        why5: chainData.why5 || ''
      };

      report.d4_data_5why.chains.push(newChain);
      this.recalculateAggregatedRootCause(report);
      return newChain;
    },

    toggleRealRootCause(report, chainId) {
      const chains = report?.d4_data_5why?.chains || [];
      const chain = chains.find(c => c.id === chainId);
      if (chain) {
        chain.is_real_root_cause = !chain.is_real_root_cause;
        this.recalculateAggregatedRootCause(report);
      }
    },

    delete5WhyChain(report, chainId) {
      if (!report?.d4_data_5why?.chains) return;
      report.d4_data_5why.chains = report.d4_data_5why.chains.filter(c => c.id !== chainId);
      this.recalculateAggregatedRootCause(report);
    },

    recalculateAggregatedRootCause(report) {
      const chains = report?.d4_data_5why?.chains || [];
      const verified = chains.filter(c => c.is_real_root_cause);
      
      const occCauses = verified.filter(c => c.type === 'occ').map(c => `• [OCCURRENCE ROOT CAUSE] ${c.title}: ${c.why5}`).join('\n');
      const escCauses = verified.filter(c => c.type === 'esc').map(c => `• [ESCAPE / DETECTION ROOT CAUSE] ${c.title}: ${c.why5}`).join('\n');

      report.d4_occurrence_root_cause = occCauses;
      report.d4_root_cause = [occCauses, escCauses].filter(Boolean).join('\n\n');
      return report.d4_root_cause;
    },

    // 4. Ishikawa 6M Cause Matrix
    saveFishbone(report, matrixData) {
      report.d4_data_fishbone = matrixData;

      const categories = [
        { key: 'man', label: 'MAN / PEOPLE' },
        { key: 'machine', label: 'MACHINE / EQUIPMENT' },
        { key: 'material', label: 'MATERIAL' },
        { key: 'method', label: 'METHOD / PROCESS' },
        { key: 'measurement', label: 'MEASUREMENT / GAUGE' },
        { key: 'env', label: 'ENVIRONMENT' }
      ];

      const findings = categories.map(cat => {
        const item = matrixData[cat.key] || { text: '-', status: 'Investigating' };
        return `• ${cat.label} [${item.status || 'Investigating'}]: ${item.text || '-'}`;
      }).join('\n');

      return `--- ISHIKAWA 6M CAUSE ANALYSIS ---\n${findings}`;
    }
  };

  window.RcaTools = RcaTools;
})(typeof window !== 'undefined' ? window : this);
