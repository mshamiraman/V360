import React from 'react';
import {
  Radar,
  NetworkCheck,
  Tune,
  AutoFixHigh,
  BugReport,
  WifiTethering,
  VpnKey,
  Lock,
  Language,
  Groups,
  Psychology,
  PhoneIphone,
  Shield,
} from '@mui/icons-material';

export interface ScanTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'discovery' | 'vulnerability' | 'compliance' | 'specialized';
  tag?: string;
}

export const SCAN_TEMPLATES: ScanTemplate[] = [
  {
    id: 'host_discovery',
    name: 'Host Discovery',
    description: 'A simple scan to discover live hosts and open ports.',
    icon: <Radar sx={{ fontSize: 32, color: '#6366F1' }} />,
    category: 'discovery',
  },
  {
    id: 'basic_network',
    name: 'Basic Network Scan',
    description: 'A full system scan suitable for any host.',
    icon: <NetworkCheck sx={{ fontSize: 32, color: '#6366F1' }} />,
    category: 'vulnerability',
  },
  {
    id: 'advanced_scan',
    name: 'Advanced Scan',
    description: 'Configure a fully customizable vulnerability scan without predefined recommendations.',
    icon: <Tune sx={{ fontSize: 32, color: '#6366F1' }} />,
    category: 'vulnerability',
  },
  {
    id: 'advanced_dynamic',
    name: 'Advanced Dynamic Scan',
    description: 'Configure a dynamic plugin-based vulnerability scan without predefined recommendations.',
    icon: <AutoFixHigh sx={{ fontSize: 32, color: '#6366F1' }} />,
    category: 'vulnerability',
  },
  {
    id: 'malware_scan',
    name: 'Malware Scan',
    description: 'Scan Windows and Linux systems for malware using authenticated scanning.',
    icon: <BugReport sx={{ fontSize: 32, color: '#6366F1' }} />,
    category: 'specialized',
  },
  {
    id: 'ping_discovery',
    name: 'Ping-Only Discovery',
    description: 'A simple scan to discover live hosts with minimal network traffic.',
    icon: <WifiTethering sx={{ fontSize: 32, color: '#6366F1' }} />,
    category: 'discovery',
  },
  {
    id: 'credential_val',
    name: 'Credential Validation',
    description: 'Verify that Windows and Linux credentials access successfully authenticate to scan targets.',
    icon: <VpnKey sx={{ fontSize: 32, color: '#6366F1' }} />,
    category: 'compliance',
  },
  {
    id: 'crypto_inventory',
    name: 'Cryptographic Inventory',
    description: 'Enumerate network services, identify cryptographic protocols, ciphers, and certificates in use.',
    icon: <Lock sx={{ fontSize: 32, color: '#6366F1' }} />,
    category: 'compliance',
  },
  {
    id: 'web_app_tests',
    name: 'Web Application Tests',
    description: 'Scan web applications for known and unknown security vulnerabilities using Nessus policies.',
    icon: <Language sx={{ fontSize: 32, color: '#6366F1' }} />,
    category: 'vulnerability',
  },
  {
    id: 'active_directory',
    name: 'Active Directory Starter Scan',
    description: 'Identify common security misconfigurations in Active Directory environments.',
    icon: <Groups sx={{ fontSize: 32, color: '#6366F1' }} />,
    category: 'specialized',
  },
  {
    id: 'find_ai',
    name: 'Find AI',
    description: 'Detect AI, Large Language Model (LLM), and Machine Learning (ML) technologies and their associated vulnerabilities.',
    icon: <Psychology sx={{ fontSize: 32, color: '#6366F1' }} />,
    category: 'specialized',
  },
  {
    id: 'mobile_device',
    name: 'Mobile Device Scan',
    description: 'Assess mobile devices through Microsoft Exchange or a Mobile Device Management (MDM) solution.',
    icon: <PhoneIphone sx={{ fontSize: 32, color: '#6366F1' }} />,
    category: 'specialized',
    tag: 'Upgrade',
  },
  {
    id: 'internal_pci',
    name: 'Internal PCI Network Scan',
    description: 'Perform an internal PCI DSS (11.2.1) vulnerability scan across your estate.',
    icon: <Shield sx={{ fontSize: 32, color: '#6366F1' }} />,
    category: 'compliance',
  },
];

export const getTemplateName = (templateId?: string): string => {
  if (!templateId) return 'Uploaded Report';
  return SCAN_TEMPLATES.find(t => t.id === templateId)?.name ?? templateId;
};
