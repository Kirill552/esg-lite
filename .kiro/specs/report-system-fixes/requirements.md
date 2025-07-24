# Requirements Document

## Introduction

This feature addresses critical issues in the ESG-Lite MVP report generation system, including UI improvements, database constraint fixes, and implementation of proper 2025-compliant report templates for 296-FZ and CBAM reports with CHECKO API integration for auto-filling company data.

## Requirements

### Requirement 1

**User Story:** As a user visiting the homepage, I want to see a clean interface without system status messages, so that I can focus on the main functionality without distractions.

#### Acceptance Criteria

1. WHEN a user visits the homepage THEN the system SHALL NOT display "Система готова к работе!" message
2. WHEN a user visits the homepage THEN the system SHALL display only the main report creation options
3. WHEN a user visits the homepage THEN the system SHALL maintain all existing functionality without the status message

### Requirement 2

**User Story:** As a user creating reports, I want the system to successfully save reports to the database, so that I can track and manage my generated reports.

#### Acceptance Criteria

1. WHEN a user creates a report THEN the system SHALL successfully save the report without foreign key constraint errors
2. WHEN a user creates a report THEN the system SHALL handle user authentication properly for database operations
3. IF a user is not authenticated THEN the system SHALL either create anonymous reports or prompt for authentication
4. WHEN a report is saved THEN the system SHALL return a success response with report details

### Requirement 3

**User Story:** As a user generating 296-FZ reports, I want the forms to comply with 2025 regulations, so that my reports meet current legal requirements.

#### Acceptance Criteria

1. WHEN generating a 296-FZ report THEN the system SHALL use the 2025-compliant form structure
2. WHEN generating a 296-FZ report THEN the system SHALL include all required fields as specified in ПП 707 к 296-ФЗ
3. WHEN generating a 296-FZ report THEN the system SHALL properly format organization details, emission data, and methodology sections
4. WHEN generating a 296-FZ report THEN the system SHALL validate all mandatory fields before generation

### Requirement 4

**User Story:** As a user generating CBAM reports, I want the forms to comply with EU Regulation 2023/1773, so that my reports meet European carbon border adjustment requirements.

#### Acceptance Criteria

1. WHEN generating a CBAM report THEN the system SHALL use the quarterly report format from Regulation 2023/1773
2. WHEN generating a CBAM report THEN the system SHALL include declarant information with EORI number
3. WHEN generating a CBAM report THEN the system SHALL include the Annex I declaration table with all required columns
4. WHEN generating a CBAM report THEN the system SHALL properly handle CN codes, quantities, countries, and emission factors

### Requirement 5

**User Story:** As a user entering company information, I want the system to auto-fill data from CHECKO API, so that I can save time and reduce manual data entry errors.

#### Acceptance Criteria

1. WHEN a user enters an INN THEN the system SHALL fetch company data from CHECKO API
2. WHEN CHECKO API returns data THEN the system SHALL auto-populate organization fields including name, OGRN, legal form, address, OKVED
3. IF CHECKO API data is incomplete THEN the system SHALL allow manual completion of missing fields
4. WHEN auto-filling data THEN the system SHALL map CHECKO response fields to report template tokens correctly
5. IF CHECKO API is unavailable THEN the system SHALL allow full manual data entry

### Requirement 6

**User Story:** As a user generating reports, I want proper HTML templates with correct field mapping, so that the generated PDFs contain accurate and well-formatted information.

#### Acceptance Criteria

1. WHEN generating reports THEN the system SHALL use HTML templates with snake_case token placeholders
2. WHEN rendering templates THEN the system SHALL replace all tokens with actual data values
3. WHEN generating PDFs THEN the system SHALL use proper fonts (DejaVu Sans) for Cyrillic text support
4. WHEN templates are missing data THEN the system SHALL display empty fields rather than tokens
5. WHEN generating reports THEN the system SHALL maintain proper table formatting and structure