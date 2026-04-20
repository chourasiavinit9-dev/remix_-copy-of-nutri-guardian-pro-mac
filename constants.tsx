import React from 'react';

export const COLORS = {
  warmWhite: '#FDFCFB',
  surfaceWhite: '#FFFFFF',
  softGreen: '#E8F5E9',
  primaryGreen: '#4CAF50',
  accentGreen: '#81C784',
  darkGreen: '#2E7D32',
  warningYellow: '#FFC107',
  dangerRed: '#EF5350',
  textGray: '#455A64'
};

export const DISEASE_GUARDRAILS = {
  'CKD Stage 3': {
    sodium: 2000,
    potassium: 2000,
    phosphorus: 800,
    sugar: 25,
    protein: 60, // Controlled protein for CKD
    vitamins: 100
  },
  'Type 2 Diabetes': {
    sodium: 2300,
    sugar: 10,
    protein: 70,
    vitamins: 100
  },
  'Hypertension': {
    sodium: 1500,
    sugar: 25,
    protein: 70,
    vitamins: 100
  },
  'Custom / Other': {
    sodium: 2300,
    sugar: 25,
    protein: 70,
    vitamins: 100
  }
};