# Design Document

## Overview

This design addresses critical issues in the ESG-Lite MVP report generation system by implementing fixes for UI cleanup, database constraints, and 2025-compliant report templates. The solution focuses on removing system status messages, fixing foreign key constraint violations, implementing proper report templates based on the provided markdown specification, and enhancing CHECKO API integration for auto-filling company data.

## Architecture

### Current System Analysis

The current system uses:
- **Frontend**: Next.js 15.4.2 with TypeScript and React components
- **Backend**: Next.js API routes with Prisma ORM
- **Database**: PostgreSQL with Clerk authentication integration
- **External APIs**: CHECKO API for company data retrieval
- **PDF Generation**: Playwright with HTML templates and DejaVu Sans fonts
- **Authentication**: Clerk for user management

### Key Issues Identified

1. **UI Issue**: System ready message displayed on create-report page
2. **Database Issue**: Foreign key constraint violation on `reports_userId_fkey`
3. **Template Issue**: Current templates don't match 2025 regulatory requirements
4. **Data Mapping Issue**: Incomplete mapping between CHECKO API and report templates

## Components and Interfaces

### 1. UI Component Updates

**Component**: `app/create-report/page.tsx`
- **Issue**: Contains hardcoded system status message
- **Solution**: Remove the status message card while preserving functionality
- **Impact**: Cleaner user interface without distracting system messages

### 2. Database Schema Analysis

**Current Schema Issues**:
- Reports table has `userId` foreign key constraint to User table
- User authentication may not be properly handled during report creation
- Missing user records could cause constraint violations

**Database Models**:
```typescript
// User model (managed by Clerk)
model User {
  id        String  @id @default(cuid())
  clerkId   String  @unique
  reports   Report[]
}

// Report model
model Report {
  id         String @id @default(cuid())
  userId     String
  user       User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  // ... other fields
}
```

### 3. Report Template System

**Template Architecture**:
- **Input**: Company data from CHECKO API + user-provided emission data
- **Processing**: Token replacement system using snake_case placeholders
- **Output**: HTML templates rendered to PDF via Playwright

**Template Structure**:
- 296-FZ Report: Russian regulatory compliance format
- CBAM Report: EU Regulation 2023/1773 quarterly format
- Token-based field replacement system

### 4. CHECKO API Integration

**Current Integration**:
- Endpoint: `/api/company-info`
- Input: INN (tax identification number)
- Output: Company information object
- Fallback: Mock data for testing

**Data Mapping Requirements**:
```typescript
interface CompanyInfo {
  inn: string;           // -> [[inn]]
  name: string;          // -> [[org_name]]
  fullName: string;      // -> [[org_name]] (full version)
  ogrn: string;          // -> [[ogrn]]
  kpp?: string;          // -> [[kpp]]
  legalForm: string;     // -> [[legal_form]]
  address: string;       // -> [[address]]
  okved: string;         // -> [[okved]]
  okvedName: string;     // -> [[okved_name]]
}
```

## Data Models

### 1. Report Template Data Structure

**296-FZ Report Template Fields**:
```typescript
interface Report296FZData {
  // Organization details
  org_name: string;
  legal_form: string;
  ogrn: string;
  inn: string;
  okpo?: string;
  oktmo?: string;
  okved: string;
  address: string;
  email?: string;
  phone?: string;
  submission_basis: string;
  
  // Process and emission data
  processes: ProcessData[];
  emissions: EmissionData[];
  methodology: MethodologyData[];
  climate_projects?: ClimateProjectData[];
  
  // Signature
  signer_fio: string;
  signer_pos: string;
  signer_sigtype: string;
  sign_date: string;
}
```

**CBAM Report Template Fields**:
```typescript
interface CBAMReportData {
  // Declarant info
  eori: string;
  year_q: string;
  
  // Declaration table
  declaration_lines: CBAMDeclarationLine[];
  
  // Signature
  cbam_signer: string;
  cbam_date: string;
}
```

### 2. Enhanced Company Data Model

```typescript
interface EnhancedCompanyInfo extends CompanyInfo {
  // Additional fields for 2025 compliance
  okpo?: string;
  oktmo?: string;
  email?: string;
  phone?: string;
  eori?: string; // For CBAM reports
}
```

## Error Handling

### 1. Database Constraint Handling

**Problem**: Foreign key constraint violation on user creation
**Solutions**:
1. **User Existence Check**: Verify user exists before creating reports
2. **User Auto-Creation**: Create user record if missing during report creation
3. **Anonymous Reports**: Allow reports without user association (optional)

**Implementation Strategy**:
```typescript
// Option 1: User verification and creation
async function ensureUserExists(userId: string, clerkUser: any) {
  const existingUser = await prisma.user.findUnique({
    where: { clerkId: userId }
  });
  
  if (!existingUser) {
    return await prisma.user.create({
      data: {
        clerkId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
      }
    });
  }
  
  return existingUser;
}
```

### 2. Template Rendering Error Handling

**Error Scenarios**:
- Missing template tokens
- Invalid data types
- PDF generation failures
- Font loading issues

**Error Handling Strategy**:
- Validate all required tokens before rendering
- Provide default values for optional fields
- Graceful degradation for missing data
- Comprehensive error logging

### 3. CHECKO API Error Handling

**Error Scenarios**:
- API unavailable
- Invalid INN format
- Company not found
- Rate limiting

**Fallback Strategy**:
- Mock data for development/testing
- Manual data entry when API fails
- Cached responses for repeated requests
- User-friendly error messages

## Testing Strategy

### 1. Unit Testing

**Components to Test**:
- Token replacement functions
- Data validation functions
- CHECKO API integration
- Database operations

**Test Cases**:
- Valid INN processing
- Invalid INN handling
- Template token replacement
- Database constraint scenarios

### 2. Integration Testing

**Test Scenarios**:
- End-to-end report generation
- CHECKO API integration
- PDF generation with various data sets
- User authentication flows

### 3. Template Testing

**Validation Points**:
- All required tokens are replaced
- PDF renders correctly with Cyrillic text
- Table formatting is preserved
- Regulatory compliance verification

## Implementation Phases

### Phase 1: Critical Fixes
1. Remove system status message from UI
2. Fix database foreign key constraint issues
3. Ensure basic report generation works

### Phase 2: Template Updates
1. Update 296-FZ template to 2025 specifications
2. Implement CBAM template structure
3. Enhance token replacement system

### Phase 3: Data Integration
1. Improve CHECKO API data mapping
2. Add missing field mappings
3. Implement data validation

### Phase 4: Testing and Validation
1. Comprehensive testing of all components
2. Regulatory compliance verification
3. Performance optimization

## Security Considerations

### 1. Data Privacy
- Secure handling of company information
- Proper data sanitization
- GDPR compliance for EU data

### 2. API Security
- Secure CHECKO API key management
- Rate limiting implementation
- Input validation and sanitization

### 3. File Security
- Secure PDF generation
- Temporary file cleanup
- Access control for generated reports

## Performance Considerations

### 1. PDF Generation
- Optimize Playwright rendering
- Font caching strategies
- Template compilation optimization

### 2. Database Operations
- Efficient user lookup and creation
- Report data indexing
- Connection pooling

### 3. API Integration
- CHECKO API response caching
- Batch processing capabilities
- Timeout handling