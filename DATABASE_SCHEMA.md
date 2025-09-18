# Database Schema Design

## 🗄️ PostgreSQL Database Schema

This document outlines the complete database schema for the Poor Kids Donation platform, optimized for PostgreSQL with proper indexing, relationships, and data integrity.

## 📊 Database Overview

### Schema Structure
```
poor_kids_donation_db/
├── Core Tables
│   ├── users
│   ├── donations
│   ├── campaigns
│   ├── beneficiaries
│   └── payment_methods
├── Supporting Tables
│   ├── categories
│   ├── countries
│   ├── currencies
│   └── stories
├── Admin Tables
│   ├── admin_users
│   ├── roles
│   ├── permissions
│   └── audit_logs
├── System Tables
│   ├── configurations
│   ├── email_templates
│   ├── notifications
│   └── sessions
└── Analytics Tables
    ├── donation_analytics
    ├── campaign_analytics
    └── user_analytics
```

## 🔑 Core Tables

### 1. Users Table
**Purpose**: Store donor information (with privacy protection)

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    country_code CHAR(2) REFERENCES countries(code),
    is_anonymous BOOLEAN DEFAULT false,
    email_verified BOOLEAN DEFAULT false,
    marketing_consent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    -- Privacy and GDPR compliance
    data_retention_consent BOOLEAN DEFAULT true,
    anonymization_requested BOOLEAN DEFAULT false,
    anonymized_at TIMESTAMP WITH TIME ZONE,
    
    -- Soft delete for data integrity
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Indexes
    CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Indexes
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_country ON users(country_code);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_anonymous ON users(is_anonymous);
```

### 2. Donations Table
**Purpose**: Core donation records with full transaction details

```sql
CREATE TABLE donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    campaign_id UUID REFERENCES campaigns(id),
    
    -- Financial details
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    currency CHAR(3) NOT NULL REFERENCES currencies(code),
    fee_amount DECIMAL(12,2) DEFAULT 0,
    net_amount DECIMAL(12,2) GENERATED ALWAYS AS (amount - fee_amount) STORED,
    
    -- Payment information
    payment_method ENUM('stripe', 'paypal', 'bank_transfer', 'cash', 'check', 'other') NOT NULL,
    payment_processor_id VARCHAR(255), -- Stripe payment_intent_id, PayPal order_id, etc.
    payment_method_id VARCHAR(255), -- Stored payment method reference
    transaction_id VARCHAR(255) UNIQUE, -- Internal transaction ID
    
    -- Donation details
    is_anonymous BOOLEAN DEFAULT false,
    is_recurring BOOLEAN DEFAULT false,
    recurring_interval ENUM('monthly', 'quarterly', 'yearly'),
    subscription_id VARCHAR(255), -- For recurring donations
    
    -- Status tracking
    status ENUM('pending', 'processing', 'completed', 'failed', 'refunded', 'disputed') DEFAULT 'pending',
    failure_reason TEXT,
    
    -- Donor message and dedication
    donor_message TEXT,
    dedication_type ENUM('honor', 'memory'),
    dedication_name VARCHAR(200),
    dedication_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    refunded_at TIMESTAMP WITH TIME ZONE,
    
    -- Tax and receipt information
    tax_receipt_sent BOOLEAN DEFAULT false,
    tax_receipt_sent_at TIMESTAMP WITH TIME ZONE,
    receipt_number VARCHAR(50) UNIQUE,
    
    -- Metadata for analytics and fraud detection
    ip_address INET,
    user_agent TEXT,
    referrer_url TEXT,
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    
    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX idx_donations_user_id ON donations(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_donations_campaign_id ON donations(campaign_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_donations_status ON donations(status);
CREATE INDEX idx_donations_created_at ON donations(created_at);
CREATE INDEX idx_donations_amount ON donations(amount);
CREATE INDEX idx_donations_currency ON donations(currency);
CREATE INDEX idx_donations_payment_method ON donations(payment_method);
CREATE INDEX idx_donations_recurring ON donations(is_recurring) WHERE is_recurring = true;
CREATE INDEX idx_donations_anonymous ON donations(is_anonymous);
CREATE INDEX idx_donations_processor_id ON donations(payment_processor_id);

-- Composite indexes for common queries
CREATE INDEX idx_donations_status_created ON donations(status, created_at);
CREATE INDEX idx_donations_campaign_status ON donations(campaign_id, status) WHERE deleted_at IS NULL;
```

### 3. Campaigns Table
**Purpose**: Fundraising campaigns with comprehensive tracking

```sql
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic information
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    short_description VARCHAR(500),
    
    -- Financial targets
    target_amount DECIMAL(12,2) NOT NULL CHECK (target_amount > 0),
    currency CHAR(3) NOT NULL REFERENCES currencies(code),
    raised_amount DECIMAL(12,2) DEFAULT 0,
    donor_count INTEGER DEFAULT 0,
    
    -- Campaign timing
    start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP WITH TIME ZONE,
    
    -- Campaign details
    category_id UUID REFERENCES categories(id),
    location VARCHAR(255),
    country_code CHAR(2) REFERENCES countries(code),
    beneficiary_count INTEGER DEFAULT 1,
    
    -- Priority and urgency
    urgency_level ENUM('low', 'medium', 'high', 'emergency') DEFAULT 'medium',
    priority_score INTEGER DEFAULT 0,
    
    -- Status and visibility
    status ENUM('draft', 'active', 'paused', 'completed', 'cancelled', 'archived') DEFAULT 'draft',
    is_featured BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT true,
    
    -- Media
    featured_image_url TEXT,
    gallery_images TEXT[], -- Array of image URLs
    video_urls TEXT[], -- Array of video URLs
    
    -- SEO and metadata
    meta_title VARCHAR(255),
    meta_description VARCHAR(500),
    keywords TEXT[],
    
    -- Admin information
    created_by UUID REFERENCES admin_users(id),
    updated_by UUID REFERENCES admin_users(id),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT campaigns_end_after_start CHECK (end_date IS NULL OR end_date > start_date),
    CONSTRAINT campaigns_raised_not_negative CHECK (raised_amount >= 0),
    CONSTRAINT campaigns_donor_count_not_negative CHECK (donor_count >= 0)
);

-- Indexes
CREATE INDEX idx_campaigns_status ON campaigns(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_campaigns_category ON campaigns(category_id);
CREATE INDEX idx_campaigns_country ON campaigns(country_code);
CREATE INDEX idx_campaigns_urgency ON campaigns(urgency_level);
CREATE INDEX idx_campaigns_featured ON campaigns(is_featured) WHERE is_featured = true;
CREATE INDEX idx_campaigns_public ON campaigns(is_public) WHERE is_public = true;
CREATE INDEX idx_campaigns_created_at ON campaigns(created_at);
CREATE INDEX idx_campaigns_end_date ON campaigns(end_date) WHERE end_date IS NOT NULL;
CREATE INDEX idx_campaigns_slug ON campaigns(slug) WHERE deleted_at IS NULL;

-- Full-text search index
CREATE INDEX idx_campaigns_search ON campaigns USING gin(to_tsvector('english', title || ' ' || description));
```

### 4. Beneficiaries Table
**Purpose**: Track individuals or groups receiving aid

```sql
CREATE TABLE beneficiaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Personal information (privacy-protected)
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    display_name VARCHAR(200), -- Public display name
    age INTEGER CHECK (age >= 0 AND age <= 150),
    gender ENUM('male', 'female', 'other', 'prefer_not_to_say'),
    
    -- Location
    location VARCHAR(255),
    country_code CHAR(2) REFERENCES countries(code),
    coordinates POINT, -- For mapping
    
    -- Story and needs
    story TEXT,
    current_situation TEXT,
    needs TEXT[],
    goals TEXT[],
    
    -- Privacy and consent
    consent_given BOOLEAN DEFAULT false,
    guardian_consent BOOLEAN DEFAULT false,
    privacy_level ENUM('public', 'limited', 'private') DEFAULT 'limited',
    can_show_photos BOOLEAN DEFAULT false,
    can_share_story BOOLEAN DEFAULT false,
    
    -- Media
    profile_image_url TEXT,
    gallery_images TEXT[],
    
    -- Status tracking
    status ENUM('active', 'graduated', 'moved', 'inactive') DEFAULT 'active',
    enrollment_date DATE,
    graduation_date DATE,
    
    -- Admin information
    created_by UUID REFERENCES admin_users(id),
    updated_by UUID REFERENCES admin_users(id),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_beneficiaries_country ON beneficiaries(country_code);
CREATE INDEX idx_beneficiaries_status ON beneficiaries(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_beneficiaries_privacy ON beneficiaries(privacy_level);
CREATE INDEX idx_beneficiaries_age ON beneficiaries(age) WHERE age IS NOT NULL;
CREATE INDEX idx_beneficiaries_location ON beneficiaries USING gist(coordinates) WHERE coordinates IS NOT NULL;
```

### 5. Campaign Beneficiaries Junction Table
**Purpose**: Link campaigns to beneficiaries (many-to-many relationship)

```sql
CREATE TABLE campaign_beneficiaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    beneficiary_id UUID NOT NULL REFERENCES beneficiaries(id) ON DELETE CASCADE,
    
    -- Relationship details
    role ENUM('primary', 'secondary', 'group_member') DEFAULT 'primary',
    allocation_percentage DECIMAL(5,2) CHECK (allocation_percentage >= 0 AND allocation_percentage <= 100),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint
    UNIQUE(campaign_id, beneficiary_id)
);

CREATE INDEX idx_campaign_beneficiaries_campaign ON campaign_beneficiaries(campaign_id);
CREATE INDEX idx_campaign_beneficiaries_beneficiary ON campaign_beneficiaries(beneficiary_id);
```

## 🏢 Admin & Management Tables

### 6. Admin Users Table
**Purpose**: Administrative user accounts with enhanced security

```sql
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic information
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    
    -- Authentication
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(255) NOT NULL,
    
    -- Two-factor authentication
    totp_secret VARCHAR(255),
    totp_enabled BOOLEAN DEFAULT false,
    backup_codes TEXT[], -- Encrypted backup codes
    
    -- Account status
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP WITH TIME ZONE,
    password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Security
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    
    -- Profile
    avatar_url TEXT,
    phone VARCHAR(20),
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Admin metadata
    created_by UUID REFERENCES admin_users(id),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_admin_users_email ON admin_users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_admin_users_active ON admin_users(is_active) WHERE is_active = true;
CREATE INDEX idx_admin_users_last_login ON admin_users(last_login_at);
```

### 7. Roles Table
**Purpose**: Define admin roles and permissions

```sql
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Role properties
    is_system_role BOOLEAN DEFAULT false, -- Cannot be deleted
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default roles
INSERT INTO roles (name, display_name, description, is_system_role) VALUES
('super_admin', 'Super Administrator', 'Full system access', true),
('finance_admin', 'Finance Administrator', 'Financial operations and reporting', true),
('content_admin', 'Content Administrator', 'Campaign and content management', true),
('viewer', 'Viewer', 'Read-only access to dashboard and reports', true);
```

### 8. Permissions Table
**Purpose**: Define granular permissions

```sql
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    resource VARCHAR(100) NOT NULL, -- e.g., 'donations', 'campaigns'
    action VARCHAR(50) NOT NULL, -- e.g., 'read', 'write', 'delete'
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default permissions
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('donations:read', 'View Donations', 'View donation records', 'donations', 'read'),
('donations:write', 'Manage Donations', 'Create and update donations', 'donations', 'write'),
('campaigns:read', 'View Campaigns', 'View campaign information', 'campaigns', 'read'),
('campaigns:write', 'Manage Campaigns', 'Create and update campaigns', 'campaigns', 'write'),
('reports:generate', 'Generate Reports', 'Create financial and analytics reports', 'reports', 'write'),
('admin:manage', 'Manage Admins', 'Manage admin users and permissions', 'admin', 'write');
```

### 9. Role Permissions Junction Table
**Purpose**: Link roles to permissions

```sql
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint
    UNIQUE(role_id, permission_id)
);
```

### 10. Admin User Roles Junction Table
**Purpose**: Assign roles to admin users

```sql
CREATE TABLE admin_user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    
    -- Assignment details
    assigned_by UUID REFERENCES admin_users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiration
    
    -- Unique constraint
    UNIQUE(admin_user_id, role_id)
);
```

## 📋 Supporting Tables

### 11. Categories Table
**Purpose**: Campaign and story categorization

```sql
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(100), -- Icon class or URL
    color VARCHAR(7), -- Hex color code
    
    -- Hierarchy support
    parent_id UUID REFERENCES categories(id),
    sort_order INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default categories
INSERT INTO categories (name, slug, description, icon, color) VALUES
('Education', 'education', 'Educational support and school supplies', 'graduation-cap', '#3B82F6'),
('Health', 'health', 'Medical care and health services', 'heart', '#EF4444'),
('Nutrition', 'nutrition', 'Food and nutrition programs', 'utensils', '#10B981'),
('Emergency', 'emergency', 'Emergency relief and disaster response', 'exclamation-triangle', '#F59E0B'),
('Infrastructure', 'infrastructure', 'Building schools, wells, and facilities', 'building', '#8B5CF6');
```

### 12. Countries Table
**Purpose**: Country reference data

```sql
CREATE TABLE countries (
    code CHAR(2) PRIMARY KEY, -- ISO 3166-1 alpha-2
    name VARCHAR(100) NOT NULL,
    currency_code CHAR(3) REFERENCES currencies(code),
    phone_prefix VARCHAR(10),
    
    -- Geographic data
    continent VARCHAR(50),
    region VARCHAR(100),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 13. Currencies Table
**Purpose**: Supported currencies

```sql
CREATE TABLE currencies (
    code CHAR(3) PRIMARY KEY, -- ISO 4217
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(10),
    decimal_places INTEGER DEFAULT 2,
    
    -- Exchange rates (updated regularly)
    usd_exchange_rate DECIMAL(10,6) DEFAULT 1.0,
    last_rate_update TIMESTAMP WITH TIME ZONE,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert major currencies
INSERT INTO currencies (code, name, symbol, decimal_places) VALUES
('USD', 'US Dollar', '$', 2),
('EUR', 'Euro', '€', 2),
('GBP', 'British Pound', '£', 2),
('CAD', 'Canadian Dollar', 'C$', 2),
('AUD', 'Australian Dollar', 'A$', 2);
```

### 14. Stories Table
**Purpose**: Success stories and updates

```sql
CREATE TABLE stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Content
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt VARCHAR(500),
    
    -- Relationships
    beneficiary_id UUID REFERENCES beneficiaries(id),
    campaign_id UUID REFERENCES campaigns(id),
    category_id UUID REFERENCES categories(id),
    
    -- Story type and status
    story_type ENUM('success', 'progress', 'need', 'thank_you', 'update') NOT NULL,
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    
    -- Media
    featured_image_url TEXT,
    gallery_images TEXT[],
    video_urls TEXT[],
    
    -- Publishing
    published_at TIMESTAMP WITH TIME ZONE,
    is_featured BOOLEAN DEFAULT false,
    
    -- SEO
    meta_title VARCHAR(255),
    meta_description VARCHAR(500),
    
    -- Admin information
    created_by UUID REFERENCES admin_users(id),
    updated_by UUID REFERENCES admin_users(id),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_stories_beneficiary ON stories(beneficiary_id);
CREATE INDEX idx_stories_campaign ON stories(campaign_id);
CREATE INDEX idx_stories_category ON stories(category_id);
CREATE INDEX idx_stories_type ON stories(story_type);
CREATE INDEX idx_stories_status ON stories(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_stories_published ON stories(published_at) WHERE published_at IS NOT NULL;
CREATE INDEX idx_stories_featured ON stories(is_featured) WHERE is_featured = true;

-- Full-text search
CREATE INDEX idx_stories_search ON stories USING gin(to_tsvector('english', title || ' ' || content));
```

## 🔧 System Tables

### 15. Configurations Table
**Purpose**: System-wide configuration settings

```sql
CREATE TABLE configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    
    -- Configuration metadata
    category VARCHAR(100),
    is_sensitive BOOLEAN DEFAULT false, -- Encrypted values
    is_public BOOLEAN DEFAULT false, -- Can be accessed by frontend
    
    -- Validation
    value_type ENUM('string', 'number', 'boolean', 'object', 'array') NOT NULL,
    validation_rules JSONB, -- JSON schema for validation
    
    -- Admin information
    updated_by UUID REFERENCES admin_users(id),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default configurations
INSERT INTO configurations (key, value, description, category, value_type, is_public) VALUES
('donation_limits', '{"min": 1, "max": 10000, "daily_max": 50000}', 'Donation amount limits', 'payments', 'object', true),
('payment_processors', '{"stripe": {"enabled": true}, "paypal": {"enabled": true}}', 'Payment processor settings', 'payments', 'object', true),
('site_settings', '{"name": "Poor Kids Donation", "tagline": "Helping children worldwide"}', 'Site information', 'general', 'object', true);
```

### 16. Audit Logs Table
**Purpose**: Track all system changes for compliance

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Actor information
    user_id UUID, -- Can be admin_user_id or regular user_id
    user_type ENUM('admin', 'user', 'system') NOT NULL,
    user_email VARCHAR(255),
    
    -- Action details
    action VARCHAR(100) NOT NULL, -- 'create', 'update', 'delete', 'login', etc.
    resource_type VARCHAR(100) NOT NULL, -- 'donation', 'campaign', 'user', etc.
    resource_id UUID,
    
    -- Change details
    old_values JSONB,
    new_values JSONB,
    changes JSONB, -- Computed diff
    
    -- Request context
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(100),
    
    -- Metadata
    description TEXT,
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for audit queries
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, user_type);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_severity ON audit_logs(severity);
```

### 17. Sessions Table
**Purpose**: Manage user sessions and JWT tokens

```sql
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User information
    user_id UUID,
    user_type ENUM('admin', 'user') NOT NULL,
    
    -- Token information
    refresh_token_hash VARCHAR(255) UNIQUE NOT NULL,
    access_token_jti VARCHAR(255) UNIQUE NOT NULL, -- JWT ID
    
    -- Session details
    ip_address INET,
    user_agent TEXT,
    device_info JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_reason VARCHAR(255)
);

-- Indexes
CREATE INDEX idx_sessions_user ON sessions(user_id, user_type) WHERE is_active = true;
CREATE INDEX idx_sessions_refresh_token ON sessions(refresh_token_hash) WHERE is_active = true;
CREATE INDEX idx_sessions_access_token ON sessions(access_token_jti) WHERE is_active = true;
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
```

## 📊 Analytics Tables

### 18. Donation Analytics Table
**Purpose**: Pre-computed analytics for performance

```sql
CREATE TABLE donation_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Time dimension
    date DATE NOT NULL,
    hour INTEGER CHECK (hour >= 0 AND hour <= 23),
    
    -- Dimensions
    campaign_id UUID REFERENCES campaigns(id),
    country_code CHAR(2) REFERENCES countries(code),
    currency CHAR(3) REFERENCES currencies(code),
    payment_method VARCHAR(50),
    
    -- Metrics
    donation_count INTEGER DEFAULT 0,
    total_amount DECIMAL(12,2) DEFAULT 0,
    average_amount DECIMAL(12,2) DEFAULT 0,
    unique_donors INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint for aggregation
    UNIQUE(date, hour, campaign_id, country_code, currency, payment_method)
);

-- Indexes for analytics queries
CREATE INDEX idx_donation_analytics_date ON donation_analytics(date);
CREATE INDEX idx_donation_analytics_campaign ON donation_analytics(campaign_id, date);
CREATE INDEX idx_donation_analytics_country ON donation_analytics(country_code, date);
```

## 🔧 Database Functions and Triggers

### Update Timestamps Trigger
```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_donations_updated_at BEFORE UPDATE ON donations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add similar triggers for other tables...
```

### Campaign Statistics Update Trigger
```sql
-- Function to update campaign statistics
CREATE OR REPLACE FUNCTION update_campaign_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update campaign raised_amount and donor_count
    UPDATE campaigns 
    SET 
        raised_amount = (
            SELECT COALESCE(SUM(amount), 0) 
            FROM donations 
            WHERE campaign_id = COALESCE(NEW.campaign_id, OLD.campaign_id) 
            AND status = 'completed'
            AND deleted_at IS NULL
        ),
        donor_count = (
            SELECT COUNT(DISTINCT user_id) 
            FROM donations 
            WHERE campaign_id = COALESCE(NEW.campaign_id, OLD.campaign_id) 
            AND status = 'completed'
            AND deleted_at IS NULL
        )
    WHERE id = COALESCE(NEW.campaign_id, OLD.campaign_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Trigger for donation changes
CREATE TRIGGER update_campaign_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON donations
    FOR EACH ROW EXECUTE FUNCTION update_campaign_stats();
```

### Audit Log Trigger
```sql
-- Function to create audit logs
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    old_data JSONB;
    new_data JSONB;
    changes JSONB;
BEGIN
    -- Convert OLD and NEW to JSONB
    IF TG_OP = 'DELETE' THEN
        old_data = to_jsonb(OLD);
        new_data = NULL;
    ELSIF TG_OP = 'INSERT' THEN
        old_data = NULL;
        new_data = to_jsonb(NEW);
    ELSE
        old_data = to_jsonb(OLD);
        new_data = to_jsonb(NEW);
    END IF;
    
    -- Calculate changes
    IF old_data IS NOT NULL AND new_data IS NOT NULL THEN
        changes = jsonb_diff(old_data, new_data);
    END IF;
    
    -- Insert audit log
    INSERT INTO audit_logs (
        action,
        resource_type,
        resource_id,
        old_values,
        new_values,
        changes,
        user_type,
        description
    ) VALUES (
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        old_data,
        new_data,
        changes,
        'system',
        TG_OP || ' operation on ' || TG_TABLE_NAME
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Apply audit triggers to sensitive tables
CREATE TRIGGER audit_donations_trigger
    AFTER INSERT OR UPDATE OR DELETE ON donations
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_campaigns_trigger
    AFTER INSERT OR UPDATE OR DELETE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();
```

## 🔒 Security Considerations

### Row Level Security (RLS)
```sql
-- Enable RLS on sensitive tables
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy for donations - users can only see their own
CREATE POLICY user_donations_policy ON donations
    FOR ALL TO authenticated_user
    USING (user_id = current_user_id());

-- Policy for admin access
CREATE POLICY admin_full_access ON donations
    FOR ALL TO admin_user
    USING (true);
```

### Data Encryption
```sql
-- Extension for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to encrypt sensitive data
CREATE OR REPLACE FUNCTION encrypt_pii(data TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(encrypt(data::bytea, current_setting('app.encryption_key')::bytea, 'aes'), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrypt sensitive data
CREATE OR REPLACE FUNCTION decrypt_pii(encrypted_data TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN convert_from(decrypt(decode(encrypted_data, 'base64'), current_setting('app.encryption_key')::bytea, 'aes'), 'UTF8');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 📈 Performance Optimization

### Partitioning for Large Tables
```sql
-- Partition donations table by date
CREATE TABLE donations_2024 PARTITION OF donations
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE donations_2025 PARTITION OF donations
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
```

### Materialized Views for Analytics
```sql
-- Materialized view for campaign performance
CREATE MATERIALIZED VIEW campaign_performance AS
SELECT 
    c.id,
    c.title,
    c.target_amount,
    c.raised_amount,
    c.donor_count,
    (c.raised_amount / c.target_amount * 100) as completion_percentage,
    COUNT(d.id) as total_donations,
    AVG(d.amount) as average_donation,
    MAX(d.created_at) as last_donation_at
FROM campaigns c
LEFT JOIN donations d ON c.id = d.campaign_id AND d.status = 'completed'
WHERE c.deleted_at IS NULL
GROUP BY c.id, c.title, c.target_amount, c.raised_amount, c.donor_count;

-- Refresh materialized view regularly
CREATE OR REPLACE FUNCTION refresh_campaign_performance()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY campaign_performance;
END;
$$ LANGUAGE plpgsql;
```

This comprehensive database schema provides a solid foundation for the Poor Kids Donation platform with proper normalization, indexing, security, and scalability considerations.