import type { BusinessSubmission } from "./business.module";

export const mockBusinessSubmissions: BusinessSubmission[] = [
  // Historical Approved Application for Existing Business bus-a (Samsung India)
  {
    id: "bsub-a",
    user_id: "usr-2", // Owner: John Doe
    business_name: "Samsung India",
    legal_name: "Samsung India Electronics Pvt Ltd",
    website: "https://www.samsung.com/in",
    phone: "+91-1800-407267864",
    country_code: "IN",
    tax_id: "IN-GST-27AAACS1234F1Z5",
    registration_number: "CIN-U31900DL1995PTC071387",
    address: {
      line1: "Sector 81, Noida",
      line2: "Industrial Area Phase II",
      city: "Noida",
      state_province: "Uttar Pradesh",
      postal_code: "201305",
      country_code: "IN"
    },
    to_claim_party_id: "pty-1",
    to_claim_party_name: "Samsung India Industrial Party",
    documents: [
      {
        id: "doc-a-1",
        doc_type: "TAX_CERTIFICATE",
        doc_name: "GST_Registration_Certificate_Samsung.pdf",
        doc_url: "https://docs.delexy.com/samsung_gst.pdf",
        file_size: "1.8 MB",
        status: "APPROVED"
      },
      {
        id: "doc-a-2",
        doc_type: "BUSINESS_LICENSE",
        doc_name: "Certificate_of_Incorporation_India.pdf",
        doc_url: "https://docs.delexy.com/samsung_cin.pdf",
        file_size: "2.5 MB",
        status: "APPROVED"
      }
    ],
    sections: {
      business_name: { field_key: "business_name", field_label: "Business Name", section: "CORE_INFO", value: "Samsung India", status: "APPROVED" },
      legal_name: { field_key: "legal_name", field_label: "Legal Entity Name", section: "CORE_INFO", value: "Samsung India Electronics Pvt Ltd", status: "APPROVED" },
      tax_id: { field_key: "tax_id", field_label: "GST Tax Identification", section: "LEGAL_TAX", value: "IN-GST-27AAACS1234F1Z5", status: "APPROVED" },
      registration_number: { field_key: "registration_number", field_label: "Registration / License Number", section: "LEGAL_TAX", value: "CIN-U31900DL1995PTC071387", status: "APPROVED" },
      address: { field_key: "address", field_label: "Corporate HQ Address", section: "ADDRESS", value: "Sector 81, Noida UP 201305, IN", status: "APPROVED" },
      to_claim_party_name: { field_key: "to_claim_party_name", field_label: "Target Party Title", section: "CLAIMED_BRANDS", value: "Samsung India Industrial Party", status: "APPROVED" }
    },
    status: "APPROVED",
    current_round: 1,
    submitted_at: "2026-01-14T10:00:00.000Z",
    reviewed_at: "2026-01-15T08:00:00.000Z",
    reviewed_by_user_name: "Platform Compliance Admin",
    audit_history: [
      {
        id: "aud-a-1",
        round: 1,
        actor_id: "usr-2",
        actor_name: "John Doe",
        action: "SUBMITTED",
        notes: "Submitted Round 1 business registration application.",
        timestamp: "2026-01-14T10:00:00.000Z"
      },
      {
        id: "aud-a-2",
        round: 1,
        actor_id: "usr-1",
        actor_name: "Platform Compliance Admin",
        action: "APPROVED",
        notes: "Approved business registration and activated 1:1 Party pty-1 & Business Tenant bus-a.",
        timestamp: "2026-01-15T08:00:00.000Z"
      }
    ],
    created_at: "2026-01-14T09:30:00.000Z",
    updated_at: "2026-01-15T08:00:00.000Z"
  },
  // Historical Approved Application for Existing Business bus-b (Samsung UK)
  {
    id: "bsub-b",
    user_id: "usr-2", // Owner: John Doe
    business_name: "Samsung UK",
    legal_name: "Samsung Electronics (UK) Limited",
    website: "https://www.samsung.com/uk",
    phone: "+44-333-000-0333",
    country_code: "GB",
    tax_id: "GB-VAT-2387654321",
    registration_number: "UK-CRN-03086621",
    address: {
      line1: "2000 Hillswood Drive",
      line2: "Chertsey",
      city: "Surrey",
      state_province: "Surrey",
      postal_code: "KT16 0RS",
      country_code: "GB"
    },
    to_claim_party_id: "pty-2",
    to_claim_party_name: "Samsung UK Electronics Party",
    documents: [
      {
        id: "doc-b-1",
        doc_type: "TAX_CERTIFICATE",
        doc_name: "HMRC_VAT_Registration_Samsung.pdf",
        doc_url: "https://docs.delexy.com/samsung_vat.pdf",
        file_size: "1.5 MB",
        status: "APPROVED"
      }
    ],
    sections: {
      business_name: { field_key: "business_name", field_label: "Business Name", section: "CORE_INFO", value: "Samsung UK", status: "APPROVED" },
      legal_name: { field_key: "legal_name", field_label: "Legal Entity Name", section: "CORE_INFO", value: "Samsung Electronics (UK) Limited", status: "APPROVED" },
      tax_id: { field_key: "tax_id", field_label: "VAT Tax ID", section: "LEGAL_TAX", value: "GB-VAT-2387654321", status: "APPROVED" },
      registration_number: { field_key: "registration_number", field_label: "Registration / License Number", section: "LEGAL_TAX", value: "UK-CRN-03086621", status: "APPROVED" },
      address: { field_key: "address", field_label: "Corporate HQ Address", section: "ADDRESS", value: "2000 Hillswood Drive, Surrey GB", status: "APPROVED" },
      to_claim_party_name: { field_key: "to_claim_party_name", field_label: "Target Party Title", section: "CLAIMED_BRANDS", value: "Samsung UK Electronics Party", status: "APPROVED" }
    },
    status: "APPROVED",
    current_round: 1,
    submitted_at: "2026-01-14T11:00:00.000Z",
    reviewed_at: "2026-01-15T08:00:00.000Z",
    reviewed_by_user_name: "Platform Compliance Admin",
    audit_history: [
      {
        id: "aud-b-1-a",
        round: 1,
        actor_id: "usr-2",
        actor_name: "John Doe",
        action: "SUBMITTED",
        notes: "Submitted Round 1 business registration application.",
        timestamp: "2026-01-14T11:00:00.000Z"
      },
      {
        id: "aud-b-2-a",
        round: 1,
        actor_id: "usr-1",
        actor_name: "Platform Compliance Admin",
        action: "APPROVED",
        notes: "Approved business registration and activated 1:1 Party pty-2 & Business Tenant bus-b.",
        timestamp: "2026-01-15T08:00:00.000Z"
      }
    ],
    created_at: "2026-01-14T10:30:00.000Z",
    updated_at: "2026-01-15T08:00:00.000Z"
  },
  // Historical Approved Application for Existing Business bus-c (Sony Corporation)
  {
    id: "bsub-c",
    user_id: "usr-3", // Owner: Alice Smith
    business_name: "Sony Corporation",
    legal_name: "Sony Corporation Global Business LLC",
    website: "https://www.sony.com",
    phone: "+1-555-0103",
    country_code: "JP",
    tax_id: "JP-NTA-101000100401",
    registration_number: "JP-CORP-701000100401",
    address: {
      line1: "1-7-1 Konan",
      line2: "Minato-ku",
      city: "Tokyo",
      state_province: "Tokyo",
      postal_code: "108-0075",
      country_code: "JP"
    },
    to_claim_party_id: "pty-4",
    to_claim_party_name: "Sony Corporation Global Party",
    documents: [
      {
        id: "doc-c-1",
        doc_type: "TAX_CERTIFICATE",
        doc_name: "Sony_Corporate_Tax_Registry_Japan.pdf",
        doc_url: "https://docs.delexy.com/sony_tax_jp.pdf",
        file_size: "2.1 MB",
        status: "APPROVED"
      }
    ],
    sections: {
      business_name: { field_key: "business_name", field_label: "Business Name", section: "CORE_INFO", value: "Sony Corporation", status: "APPROVED" },
      legal_name: { field_key: "legal_name", field_label: "Legal Entity Name", section: "CORE_INFO", value: "Sony Corporation Global Business LLC", status: "APPROVED" },
      tax_id: { field_key: "tax_id", field_label: "Japan Corporate Tax ID", section: "LEGAL_TAX", value: "JP-NTA-101000100401", status: "APPROVED" },
      registration_number: { field_key: "registration_number", field_label: "Registration / License Number", section: "LEGAL_TAX", value: "JP-CORP-701000100401", status: "APPROVED" },
      address: { field_key: "address", field_label: "Corporate HQ Address", section: "ADDRESS", value: "1-7-1 Konan, Minato-ku Tokyo JP", status: "APPROVED" },
      to_claim_party_name: { field_key: "to_claim_party_name", field_label: "Target Party Title", section: "CLAIMED_BRANDS", value: "Sony Corporation Global Party", status: "APPROVED" }
    },
    status: "APPROVED",
    current_round: 1,
    submitted_at: "2026-03-14T09:00:00.000Z",
    reviewed_at: "2026-03-15T08:00:00.000Z",
    reviewed_by_user_name: "Platform Compliance Admin",
    audit_history: [
      {
        id: "aud-c-1",
        round: 1,
        actor_id: "usr-3",
        actor_name: "Alice Smith",
        action: "SUBMITTED",
        notes: "Submitted Round 1 business registration application.",
        timestamp: "2026-03-14T09:00:00.000Z"
      },
      {
        id: "aud-c-2",
        round: 1,
        actor_id: "usr-1",
        actor_name: "Platform Compliance Admin",
        action: "APPROVED",
        notes: "Approved business registration and activated 1:1 Party pty-4 & Business Tenant bus-c.",
        timestamp: "2026-03-15T08:00:00.000Z"
      }
    ],
    created_at: "2026-03-14T08:30:00.000Z",
    updated_at: "2026-03-15T08:00:00.000Z"
  },
  // Historical Approved Application for Existing Business bus-d (ASUSTeK Computer Inc)
  {
    id: "bsub-d",
    user_id: "usr-4", // Owner: Robert Johnson
    business_name: "ASUSTeK Computer Inc",
    legal_name: "ASUSTeK Computer Inc Global Distribution",
    website: "https://www.asus.com",
    phone: "+1-555-0104",
    country_code: "TW",
    tax_id: "TW-GUI-22098765",
    registration_number: "TW-ROC-22098765",
    address: {
      line1: "15 Li-Te Road",
      line2: "Beitou District",
      city: "Taipei",
      state_province: "Taipei",
      postal_code: "112",
      country_code: "TW"
    },
    to_claim_party_id: "pty-5",
    to_claim_party_name: "ASUSTeK Computer Inc Party",
    documents: [
      {
        id: "doc-d-1",
        doc_type: "TAX_CERTIFICATE",
        doc_name: "ASUS_Tax_Certificate_Taiwan.pdf",
        doc_url: "https://docs.delexy.com/asus_tax_tw.pdf",
        file_size: "1.9 MB",
        status: "APPROVED"
      }
    ],
    sections: {
      business_name: { field_key: "business_name", field_label: "Business Name", section: "CORE_INFO", value: "ASUSTeK Computer Inc", status: "APPROVED" },
      legal_name: { field_key: "legal_name", field_label: "Legal Entity Name", section: "CORE_INFO", value: "ASUSTeK Computer Inc Global Distribution", status: "APPROVED" },
      tax_id: { field_key: "tax_id", field_label: "GUI Tax Identification", section: "LEGAL_TAX", value: "TW-GUI-22098765", status: "APPROVED" },
      registration_number: { field_key: "registration_number", field_label: "Registration / License Number", section: "LEGAL_TAX", value: "TW-ROC-22098765", status: "APPROVED" },
      address: { field_key: "address", field_label: "Corporate HQ Address", section: "ADDRESS", value: "15 Li-Te Road, Beitou Taipei TW", status: "APPROVED" },
      to_claim_party_name: { field_key: "to_claim_party_name", field_label: "Target Party Title", section: "CLAIMED_BRANDS", value: "ASUSTeK Computer Inc Party", status: "APPROVED" }
    },
    status: "APPROVED",
    current_round: 1,
    submitted_at: "2026-04-09T10:00:00.000Z",
    reviewed_at: "2026-04-10T08:00:00.000Z",
    reviewed_by_user_name: "Platform Compliance Admin",
    audit_history: [
      {
        id: "aud-d-1",
        round: 1,
        actor_id: "usr-4",
        actor_name: "Robert Johnson",
        action: "SUBMITTED",
        notes: "Submitted Round 1 business registration application.",
        timestamp: "2026-04-09T10:00:00.000Z"
      },
      {
        id: "aud-d-2",
        round: 1,
        actor_id: "usr-1",
        actor_name: "Platform Compliance Admin",
        action: "APPROVED",
        notes: "Approved business registration and activated 1:1 Party pty-5 & Business Tenant bus-d.",
        timestamp: "2026-04-10T08:00:00.000Z"
      }
    ],
    created_at: "2026-04-09T09:30:00.000Z",
    updated_at: "2026-04-10T08:00:00.000Z"
  },
  // Pending Submission Entry 1
  {
    id: "bsub-101",
    user_id: "usr-2", // Business member / owner
    business_name: "Apex Global Tech LLC",
    legal_name: "Apex Global Technology Enterprises LLC",
    website: "https://www.apexglobaltech.com",
    phone: "+1-555-0199",
    country_code: "US",
    tax_id: "US-EIN-987654321",
    registration_number: "LLC-2026-88102",
    address: {
      line1: "750 Innovation Parkway",
      line2: "Suite 400",
      city: "Austin",
      state_province: "TX",
      postal_code: "78701",
      country_code: "US"
    },
    to_claim_party_id: "pty-3",
    to_claim_party_name: "ASICS Corp Placeholder Party",
    documents: [
      {
        id: "doc-101-1",
        doc_type: "TAX_CERTIFICATE",
        doc_name: "IRS_EIN_Certificate_Apex.pdf",
        doc_url: "https://docs.delexy.com/sample_tax_cert.pdf",
        file_size: "1.2 MB",
        status: "APPROVED"
      },
      {
        id: "doc-101-2",
        doc_type: "BUSINESS_LICENSE",
        doc_name: "Texas_State_Business_License_2026.pdf",
        doc_url: "https://docs.delexy.com/sample_license.pdf",
        file_size: "2.4 MB",
        status: "APPROVED"
      },
      {
        id: "doc-101-3",
        doc_type: "TRADEMARK_REGISTRATION",
        doc_name: "Apex_Brand_USPTO_Trademark.pdf",
        doc_url: "https://docs.delexy.com/sample_trademark.pdf",
        file_size: "850 KB",
        status: "PENDING"
      }
    ],
    sections: {
      business_name: { field_key: "business_name", field_label: "Business Name", section: "CORE_INFO", value: "Apex Global Tech LLC", status: "PENDING" },
      legal_name: { field_key: "legal_name", field_label: "Legal Entity Name", section: "CORE_INFO", value: "Apex Global Technology Enterprises LLC", status: "PENDING" },
      tax_id: { field_key: "tax_id", field_label: "Tax Identification Number (EIN)", section: "LEGAL_TAX", value: "US-EIN-987654321", status: "PENDING" },
      registration_number: { field_key: "registration_number", field_label: "Registration / License Number", section: "LEGAL_TAX", value: "LLC-2026-88102", status: "PENDING" },
      address: { field_key: "address", field_label: "Corporate HQ Address", section: "ADDRESS", value: "750 Innovation Parkway, Austin TX", status: "PENDING" },
      to_claim_party_name: { field_key: "to_claim_party_name", field_label: "Target Party Title", section: "CLAIMED_BRANDS", value: "ASICS Corp Placeholder Party", status: "PENDING" }
    },
    status: "SUBMITTED",
    current_round: 1,
    submitted_at: "2026-07-30T10:15:00.000Z",
    audit_history: [
      {
        id: "aud-b-1",
        round: 1,
        actor_id: "usr-2",
        actor_name: "Jane Smith",
        action: "SUBMITTED",
        notes: "Submitted Round 1 business registration application with tax ID & trademark proof.",
        timestamp: "2026-07-30T10:15:00.000Z"
      }
    ],
    created_at: "2026-07-30T10:00:00.000Z",
    updated_at: "2026-07-30T10:15:00.000Z"
  },
  // Revision Submission Entry 2
  {
    id: "bsub-102",
    user_id: "usr-3",
    business_name: "Nordic Industrial Solutions",
    legal_name: "Nordic Industrial Solutions AB",
    website: "https://www.nordicindustrial.se",
    phone: "+46-8-1234567",
    country_code: "SE",
    tax_id: "SE-556123456701",
    registration_number: "SE-556123-4567",
    address: {
      line1: "Kungsgatan 44",
      city: "Stockholm",
      state_province: "Stockholm",
      postal_code: "111 35",
      country_code: "SE"
    },
    to_claim_party_id: "pty-7",
    to_claim_party_name: "Logitech Inc Placeholder Party",
    documents: [
      {
        id: "doc-102-1",
        doc_type: "TAX_CERTIFICATE",
        doc_name: "Swedish_Tax_Moms_Reg.pdf",
        doc_url: "https://docs.delexy.com/sample_tax_se.pdf",
        file_size: "1.1 MB",
        status: "REJECTED",
        rejection_comment: "Document expired in June 2026. Please upload valid 2026 tax registration certificate."
      }
    ],
    sections: {
      business_name: { field_key: "business_name", field_label: "Business Name", section: "CORE_INFO", value: "Nordic Industrial Solutions", status: "APPROVED" },
      legal_name: { field_key: "legal_name", field_label: "Legal Entity Name", section: "CORE_INFO", value: "Nordic Industrial Solutions AB", status: "APPROVED" },
      tax_id: { field_key: "tax_id", field_label: "VAT Tax ID", section: "LEGAL_TAX", value: "SE-556123456701", status: "REJECTED", rejection_comment: "Expired tax certificate attached." },
      registration_number: { field_key: "registration_number", field_label: "Registration / License Number", section: "LEGAL_TAX", value: "SE-556123-4567", status: "APPROVED" },
      address: { field_key: "address", field_label: "Corporate HQ Address", section: "ADDRESS", value: "Kungsgatan 44, Stockholm SE", status: "APPROVED" },
      to_claim_party_name: { field_key: "to_claim_party_name", field_label: "Target Party Title", section: "CLAIMED_BRANDS", value: "Logitech Inc Placeholder Party", status: "APPROVED" }
    },
    status: "NEEDS_REVISION",
    current_round: 1,
    submitted_at: "2026-07-28T14:20:00.000Z",
    reviewed_at: "2026-07-29T09:00:00.000Z",
    reviewed_by_user_name: "Platform Compliance Admin",
    audit_history: [
      {
        id: "aud-b-2",
        round: 1,
        actor_id: "usr-1",
        actor_name: "Platform Compliance Admin",
        action: "REQUESTED_REVISION",
        notes: "Requested seller revision for Round 1 due to expired tax certificate.",
        timestamp: "2026-07-29T09:00:00.000Z"
      }
    ],
    created_at: "2026-07-28T14:00:00.000Z",
    updated_at: "2026-07-29T09:00:00.000Z"
  }
];
